import { createMistral } from '@ai-sdk/mistral';

const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

function normalizeBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return {};
}

/**
 * One-time migration endpoint.
 * Takes the existing monolithic profile JSON and breaks it into individual memory entries
 * with embeddings, ready for the new semantic memory system.
 *
 * POST /api/memory/migrate
 * Body: { profile: { core_essence: {...}, shadow_work: {...}, ... } }
 * Returns: { memories: [{ fact, category, isPinned, embedding }] }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.MISTRAL_API_KEY) {
    return res.status(500).json({ error: 'Missing MISTRAL_API_KEY' });
  }

  const { profile } = normalizeBody(req);

  if (!profile || typeof profile !== 'object') {
    return res.status(400).json({ error: 'A "profile" object is required.' });
  }

  try {
    // Break the monolithic profile into atomic facts
    const facts = [];

    // Core essence
    const ce = profile.core_essence || {};
    if (ce.name) facts.push({ fact: `User's name is ${ce.name}`, category: 'core_essence', isPinned: true });
    if (ce.age) facts.push({ fact: `User's age is ${ce.age}`, category: 'core_essence', isPinned: true });
    (ce.core_values || []).forEach((v) => {
      if (v) facts.push({ fact: `Core value: ${v}`, category: 'core_essence', isPinned: false });
    });
    (ce.life_goals || []).forEach((g) => {
      if (g) facts.push({ fact: `Life goal: ${g}`, category: 'core_essence', isPinned: false });
    });
    (ce.major_past_traumas || []).forEach((t) => {
      if (t) facts.push({ fact: `Past trauma: ${t}`, category: 'core_essence', isPinned: false });
    });

    // Ecosystem
    (profile.ecosystem || []).forEach((person) => {
      if (person?.name) {
        const parts = [`${person.name} is the user's ${person.relation || 'contact'}`];
        if (person.sentiment) parts.push(`(sentiment: ${person.sentiment})`);
        facts.push({ fact: parts.join(' '), category: 'ecosystem', isPinned: false });
      }
    });

    // Shadow work
    const sw = profile.shadow_work || {};
    (sw.recurring_anxieties || []).forEach((a) => {
      if (a) facts.push({ fact: `Recurring anxiety: ${a}`, category: 'shadow_work', isPinned: false });
    });
    (sw.recurring_fears || []).forEach((f) => {
      if (f) facts.push({ fact: `Recurring fear: ${f}`, category: 'shadow_work', isPinned: false });
    });
    (sw.insecurities || []).forEach((i) => {
      if (i) facts.push({ fact: `Insecurity: ${i}`, category: 'shadow_work', isPinned: false });
    });
    (sw.inferiority_triggers || []).forEach((t) => {
      if (t) facts.push({ fact: `Inferiority trigger: ${t}`, category: 'shadow_work', isPinned: false });
    });

    // Daily routine
    const dr = profile.daily_routine || {};
    (dr.current_projects || []).forEach((p) => {
      if (p) facts.push({ fact: `Current project: ${p}`, category: 'daily_routine', isPinned: false });
    });
    (dr.daily_habits || []).forEach((h) => {
      if (h) facts.push({ fact: `Daily habit: ${h}`, category: 'daily_routine', isPinned: false });
    });
    (dr.health_status || []).forEach((s) => {
      if (s) facts.push({ fact: `Health: ${s}`, category: 'daily_routine', isPinned: false });
    });
    (dr.current_focus || []).forEach((f) => {
      if (f) facts.push({ fact: `Current focus: ${f}`, category: 'daily_routine', isPinned: false });
    });

    // Ephemeral
    const eph = profile.ephemeral || {};
    (eph.fragments || []).forEach((f) => {
      if (f) facts.push({ fact: f, category: 'ephemeral', isPinned: false });
    });

    // Communication style
    if (profile.communication_style) {
      facts.push({
        fact: `Preferred communication style: ${profile.communication_style}`,
        category: 'core_essence',
        isPinned: true,
      });
    }

    if (!facts.length) {
      return res.status(200).json({ memories: [], message: 'No facts to migrate.' });
    }

    // Embed all facts in a single batch
    const factTexts = facts.map((f) => f.fact);

    const embedResponse = await fetch('https://api.mistral.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: factTexts,
      }),
    });

    const embedData = await embedResponse.json();

    if (!embedResponse.ok) {
      throw new Error(embedData?.message || 'Embedding failed during migration');
    }

    const embeddings = (embedData.data || [])
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);

    // Combine facts with embeddings
    const memories = facts.map((fact, index) => ({
      ...fact,
      embedding: embeddings[index] || [],
    }));

    return res.status(200).json({
      memories,
      message: `Successfully migrated ${memories.length} memory entries.`,
    });
  } catch (error) {
    const message = error?.message || 'Unknown migration error';
    return res.status(500).json({ error: `Migration failed: ${message}` });
  }
}
