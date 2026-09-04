import { createMistral } from '@ai-sdk/mistral';

const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY,
});
import { generateObject } from 'ai';
import { z } from 'zod';

const MEMORY_EXTRACTION_PROMPT = `System Prompt: The Memory Architect
Role: You are the Subconscious Memory Manager for KrishnaGPT, a life-guide AI.

Task:
- Analyze the latest N user messages and the current user profile.
- Update profile using these categories:
  1) core_essence (static): name, age, core_values, life_goals, major_past_traumas
  2) ecosystem (social): people mentioned, relation, sentiment, notes
  3) shadow_work (therapeutic priority): recurring_anxieties, recurring_fears, insecurities, inferiority_triggers
  4) daily_routine (dynamic): current_projects, daily_habits, health_status, current_focus
  5) ephemeral (transient): fragments

Constraints:
- Do not repeat information.
- If a new detail contradicts old details, overwrite old details.
- Merge redundant details.
- Keep concise and grounded in explicit user evidence.
- No diagnosis and no invented facts.
- No diagnosis and no invented facts.
\`;

const profileSchema = z.object({
  core_essence: z.object({
    name: z.string().default(''),
    age: z.string().default(''),
    core_values: z.array(z.string()).default([]),
    life_goals: z.array(z.string()).default([]),
    major_past_traumas: z.array(z.string()).default([])
  }).default({}),
  ecosystem: z.array(z.object({
    name: z.string().default(''),
    relation: z.string().default(''),
    sentiment: z.string().default(''),
    notes: z.array(z.string()).default([])
  })).default([]),
  shadow_work: z.object({
    recurring_anxieties: z.array(z.string()).default([]),
    recurring_fears: z.array(z.string()).default([]),
    insecurities: z.array(z.string()).default([]),
    inferiority_triggers: z.array(z.string()).default([])
  }).default({}),
  daily_routine: z.object({
    current_projects: z.array(z.string()).default([]),
    daily_habits: z.array(z.string()).default([]),
    health_status: z.array(z.string()).default([]),
    current_focus: z.array(z.string()).default([])
  }).default({}),
  ephemeral: z.object({
    fragments: z.array(z.string()).default([])
  }).default({}),
  communication_style: z.string().default('')
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



export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.MISTRAL_API_KEY) {
    return res.status(500).json({ error: 'Missing MISTRAL_API_KEY' });
  }

  const { messages, message, userProfile, messageLimit = 10 } = normalizeBody(req);

  const normalizedMessages = (Array.isArray(messages) ? messages : [message])
    .map((item) => `${item || ''}`.trim())
    .filter(Boolean)
    .slice(-Math.max(1, Number(messageLimit) || 10));

  if (!normalizedMessages.length) {
    return res
      .status(400)
      .json({ error: 'A non-empty string "message" or non-empty array "messages" is required.' });
  }

  try {
    const prompt = [
      `Latest ${normalizedMessages.length} user messages:`,
      ...normalizedMessages.map((entry, index) => `${index + 1}. ${entry}`),
      '',
      'Current user profile JSON:',
      JSON.stringify(userProfile || {}, null, 2),
      '',
      'Return the fully updated profile JSON only.',
    ].join('\n');

    const { object } = await generateObject({
      model: mistral('ministral-8b-2512'),
      schema: profileSchema,
      system: MEMORY_EXTRACTION_PROMPT,
      prompt,
    });

    const profile = object;
    return res.status(200).json({ profile });
  } catch (error) {
    const messageText = error?.message || 'Unknown upstream error';
    return res.status(500).json({ error: `Memory extraction failed: ${messageText}` });
  }
}
