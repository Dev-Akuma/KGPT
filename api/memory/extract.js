import { createMistral } from '@ai-sdk/mistral';
import { generateObject } from 'ai';
import { z } from 'zod';

const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

const DELTA_EXTRACTION_PROMPT = `System Prompt: The Memory Architect
Role: You are the Subconscious Memory Manager for The Compass, a life-guide AI.

Task:
- Analyze the latest user messages.
- Extract ONLY NEW discrete facts that are NOT already present in the existing memories list.
- Each fact should be a single, atomic piece of information about the user.
- Categorize each fact into one of these categories:
  1) core_essence: name, age, core values, life goals, major past traumas
  2) ecosystem: people mentioned with their relation and sentiment
  3) shadow_work: recurring anxieties, fears, insecurities, inferiority triggers
  4) daily_routine: current projects, daily habits, health status, current focus
  5) ephemeral: transient thoughts, what's on their mind right now

Constraints:
- ONLY extract genuinely new information not already covered by existing memories.
- If the user repeats something already known, do NOT include it.
- Keep each fact concise (one sentence max).
- No diagnosis and no invented facts.
- If there is nothing new to extract, return an empty array.`;

const deltaSchema = z.object({
  memories: z.array(z.object({
    fact: z.string().describe('A single atomic fact about the user, e.g. "User feels guilty about giving in to urges"'),
    category: z.enum(['core_essence', 'ecosystem', 'shadow_work', 'daily_routine', 'ephemeral']).describe('The category this fact belongs to'),
    isPinned: z.boolean().default(false).describe('True only for critical identity facts like name, age, or communication style preference'),
  })).describe('Array of new memory entries extracted from the messages'),
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

  const { messages, existingMemories = [] } = normalizeBody(req);

  const normalizedMessages = (Array.isArray(messages) ? messages : [])
    .map((item) => `${item || ''}`.trim())
    .filter(Boolean);

  if (!normalizedMessages.length) {
    return res.status(400).json({ error: 'A non-empty "messages" array is required.' });
  }

  // Build a summary of what we already know so the LLM can avoid duplicates
  const existingFactsSummary = (Array.isArray(existingMemories) ? existingMemories : [])
    .map((m) => `- ${m.fact || m}`)
    .join('\n');

  try {
    const prompt = [
      `Latest user messages:`,
      ...normalizedMessages.map((entry, index) => `${index + 1}. ${entry}`),
      '',
      existingFactsSummary
        ? `Existing memories (do NOT duplicate these):\n${existingFactsSummary}`
        : 'No existing memories yet.',
      '',
      'Extract only NEW facts from the messages above.',
    ].join('\n');

    const { object } = await generateObject({
      model: mistral('ministral-3b-2512'),
      schema: deltaSchema,
      system: DELTA_EXTRACTION_PROMPT,
      prompt,
    });

    return res.status(200).json({ memories: object.memories || [] });
  } catch (error) {
    const messageText = error?.message || 'Unknown upstream error';
    return res.status(500).json({ error: `Memory extraction failed: ${messageText}` });
  }
}
