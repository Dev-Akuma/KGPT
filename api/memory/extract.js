import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

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
- Return valid JSON only, no markdown fences.

Return schema:
{
  "core_essence": {
    "name": string,
    "age": string,
    "core_values": string[],
    "life_goals": string[],
    "major_past_traumas": string[]
  },
  "ecosystem": [
    {
      "name": string,
      "relation": string,
      "sentiment": string,
      "notes": string[]
    }
  ],
  "shadow_work": {
    "recurring_anxieties": string[],
    "recurring_fears": string[],
    "insecurities": string[],
    "inferiority_triggers": string[]
  },
  "daily_routine": {
    "current_projects": string[],
    "daily_habits": string[],
    "health_status": string[],
    "current_focus": string[]
  },
  "ephemeral": {
    "fragments": string[]
  },
  "communication_style": string
}`;

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

function parseJsonResponse(text) {
  const raw = (text || '').trim();
  const normalized = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(normalized || '{}');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY' });
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

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: MEMORY_EXTRACTION_PROMPT,
      prompt,
    });

    const profile = parseJsonResponse(text);
    return res.status(200).json({ profile });
  } catch (error) {
    const messageText = error?.message || 'Unknown upstream error';
    return res.status(500).json({ error: `Memory extraction failed: ${messageText}` });
  }
}
