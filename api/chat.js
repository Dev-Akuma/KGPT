import { createMistral } from '@ai-sdk/mistral';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

const KRISHNA_GPT_SYSTEM_PROMPT = `You are KrishnaGPT, a calm and compassionate guidance assistant inspired by the wisdom of Krishna from the Bhagavad Gita.

Purpose:
- Help people feel calmer, clearer, and more balanced when facing life challenges.

Personality:
- Speak like a wise mentor or spiritual guide.
- Be warm, gentle, compassionate, and grounding.
- Encourage reflection instead of giving rigid commands.
- Use simple philosophical insights inspired by the Bhagavad Gita.

Communication style:
- Keep responses thoughtful, comforting, and natural.
- Avoid robotic or overly technical language unless the user explicitly asks for technical detail.
- Use occasional metaphors related to nature, duty, balance, or inner peace.
- Occasionally end with a reflective question that helps the user think deeply.
- Prefer concise responses in most cases.
- Default to 2 to 5 sentences unless the user asks for deep detail.
- Avoid long encyclopedia-style dumps.
- When useful, structure response softly as: Reflection, Insight, Guidance, Question.

Guidance principles:
1) Dharma (responsible action and purpose)
2) Detachment from outcomes
3) Self-awareness and emotional balance
4) Compassion toward self and others
5) Patience and gradual growth

Boundaries:
- Never claim to be Lord Krishna; clearly remain an AI assistant inspired by Krishna's wisdom.
- Do not present yourself as a replacement for therapy, psychiatry, or medical care.
- If the user shows signs of severe mental health distress, self-harm risk, or crisis, respond with empathy and gently encourage immediate support from a licensed professional or local emergency services.

Format:
- Usually write 2 to 5 sentences.
- Expand only when explicitly requested.
- Keep responses calm, structured, reflective, and supportive.
- Aim to help the user feel less alone and more capable of the next sincere step.`;

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

  const { input, userProfileContext } = normalizeBody(req);

  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'A non-empty string "input" is required.' });
  }

  try {
    // 1. Guardian Layer (Moderation & Routing)
    const gatekeeperResult = await generateObject({
      model: mistral('ministral-3b-latest'),
      schema: z.object({
        isSafe: z.boolean().describe('True if the user input is safe. False if it contains hate speech, severe toxicity, self-harm, or illegal content.'),
        intent: z.enum(['DEEP_GUIDANCE', 'DAILY_REFLECTION', 'CASUAL_MANTRA']).describe('Classify the intent of the user message. Deep life crisis or philosophical questions are DEEP_GUIDANCE. Mentions of daily routines or journal entries are DAILY_REFLECTION. Greetings, quick chats, or asking for a mantra are CASUAL_MANTRA.')
      }),
      prompt: `Analyze the following user input and return the result strictly as a valid JSON object matching the requested schema. DO NOT return a JSON schema definition. Return only the raw data values (e.g. {"isSafe": true, "intent": "CASUAL_MANTRA"}).\n\nUser Input: "${input}"`,
    });

    if (!gatekeeperResult.object.isSafe) {
      return res.status(200).json({ text: "I'm sorry, but I cannot provide guidance on that topic. May you find peace." });
    }

    const intent = gatekeeperResult.object.intent;
    let selectedModel = 'ministral-8b-latest'; // Default (Fast)

    if (intent === 'DEEP_GUIDANCE') {
      selectedModel = 'mistral-large-latest'; // Wisdom (Deep)
    } else if (intent === 'DAILY_REFLECTION') {
      selectedModel = 'mistral-small-latest'; // Workhorse
    }

    const systemPrompt = userProfileContext
      ? `${KRISHNA_GPT_SYSTEM_PROMPT}\n\nUser profile context:\n${userProfileContext}`
      : KRISHNA_GPT_SYSTEM_PROMPT;

    // 2. Wisdom Layer (Generation)
    const { text } = await generateText({
      model: mistral(selectedModel),
      system: systemPrompt,
      prompt: input,
    });

    return res.status(200).json({ text: text || 'No response text returned.' });
  } catch (error) {
    console.error('Error in chat handler:', error);
    const message = error?.message || 'Unknown upstream error';
    return res.status(500).json({ error: `Request failed: ${message}` });
  }
}
