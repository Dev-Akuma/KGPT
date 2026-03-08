import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

const MEMORY_EXTRACTION_PROMPT = `You analyze user messages and extract long-term user profile signals.

Rules:
- Return valid JSON only, with no markdown fences.
- Keep insights concise and useful for long-term personalization.
- If multiple signals imply a broader pattern, prefer archetypes over too many granular traits.
- Do not invent sensitive clinical diagnoses.

Return schema:
{
  "traits": string[],
  "habits": string[],
  "concerns": string[],
  "goals": string[],
  "archetypes": string[],
  "communication_style": string,
  "insights": string[]
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

  const { message } = normalizeBody(req);

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A non-empty string "message" is required.' });
  }

  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: MEMORY_EXTRACTION_PROMPT,
      prompt: `User message:\n${message}`,
    });

    const insights = parseJsonResponse(text);
    return res.status(200).json({ insights });
  } catch (error) {
    const messageText = error?.message || 'Unknown upstream error';
    return res.status(500).json({ error: `Memory extraction failed: ${messageText}` });
  }
}
