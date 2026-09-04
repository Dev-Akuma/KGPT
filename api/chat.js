import { createMistral } from '@ai-sdk/mistral';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

const COMPASS_SYSTEM_PROMPT = `You are The Compass — a thoughtful, honest companion who helps people think more clearly, not just feel better.

VOICE & TONE:
- Warm but not syrupy. Honest but not harsh. Specific, not generic.
- Write like a sharp, caring friend — not a therapist, life coach, or motivational speaker.
- No headers, no bullet points, no structured labels (Reflection:, Insight:, Guidance:, Question:, P.S.:).
- Use "you" and "I" naturally. Match the user's register — casual when they're casual, serious when they're serious.
- Mirror their language style, including mild profanity if they use it.

LENGTH & PRECISION:
- Target 150–250 words for reflective topics. 2–4 sentences for simple exchanges.
- Never repeat the same idea in different words. Say it once, clearly.
- Prefer one precise insight over three vague ones.
- Generic self-help advice ("make your bed," "take it one step at a time") is almost always wrong — respond to the specific thing the person is actually wrestling with.

HOW YOU THINK:
- Don't automatically agree with the user's framing. Sometimes the most useful thing is to question the premise.
- Challenge when it matters. Constant validation is its own form of uselessness.
- Distinguish what the user said from what you're interpreting. Use "it sounds like..." not "you are..." when reading between the lines.
- Notice conceptual confusions and name them precisely. For example: maturity is not suppressing emotions, it means feeling something without automatically obeying it. Independence is not needing nobody, it means standing on your own feet so you can love people without needing them to hold you up. Strength is not emotional coldness. Reliability is not never failing.
- Never frame a third party as the hidden reward or measurement of the user's growth. Whether someone else notices or reacts should never be the implicit payoff. Progress is about who the user is becoming, independent of anyone else.

WHAT YOU NEVER DO:
- Never string therapeutic template phrases back to back ("That's huge," "I hear you so much," "not creepy, that's human") — used sparingly they're fine, used repeatedly they're hollow.
- Never end every response with a "what's one small thing you could do today" coaching question. Sometimes the right move is a reframe, a challenge, or just a clean true statement.
- Never use bullet point lists in your responses.
- Never diagnose. If someone is in genuine crisis, be warm and direct about getting real support.
- Never be so gentle you become useless.

ENDINGS:
- Vary them. Sometimes a question. Sometimes a reframe. Sometimes just a clean, true statement the person can sit with.
- End when you've said the useful thing — not when you've run out of encouraging words.`;

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

  const { input, userProfileContext, history } = normalizeBody(req);

  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'A non-empty string "input" is required.' });
  }

  try {
    // 1. Guardian Layer (Routing)
    const gatekeeperResult = await generateObject({
      model: mistral('ministral-3b-2512'),
      schema: z.object({
        intent: z.enum(['DEEP_GUIDANCE', 'DAILY_REFLECTION', 'CASUAL_MANTRA']).describe('Classify the intent of the user message. Deep life crisis or philosophical questions are DEEP_GUIDANCE. Mentions of daily routines or journal entries are DAILY_REFLECTION. Greetings, quick chats, or asking for a mantra are CASUAL_MANTRA.')
      }),
      prompt: `Analyze the following user input and return the result strictly as a valid JSON object matching the requested schema. DO NOT return a JSON schema definition. Return only the raw data values (e.g. {"intent": "CASUAL_MANTRA"}).\n\nUser Input: "${input}"`,
    });

    const intent = gatekeeperResult.object.intent;
    let selectedModel = 'ministral-8b-2512'; // Default (Fast)

    if (intent === 'DEEP_GUIDANCE') {
      selectedModel = 'ministral-14b-2512'; // Highest capacity available model on this tier
    } else if (intent === 'DAILY_REFLECTION') {
      selectedModel = 'ministral-8b-2512'; // Workhorse
    }

    const trimmedContext = typeof userProfileContext === 'string' ? userProfileContext.trim() : '';
    const systemPrompt = trimmedContext
      ? `${COMPASS_SYSTEM_PROMPT}\n\nUser profile context:\n${trimmedContext}`
      : COMPASS_SYSTEM_PROMPT;

    // 2. Wisdom Layer (Generation)
    // Build multi-turn message history for conversational context
    const chatMessages = [];

    // Add prior conversation history (if provided)
    if (Array.isArray(history) && history.length > 0) {
      history.forEach((msg) => {
        if (msg.content && (msg.role === 'user' || msg.role === 'assistant')) {
          chatMessages.push({ role: msg.role, content: msg.content });
        }
      });
    }

    // Add the current user message
    chatMessages.push({ role: 'user', content: input });

    const { text } = await generateText({
      model: mistral(selectedModel),
      system: systemPrompt,
      messages: chatMessages,
    });

    return res.status(200).json({ text: text || 'No response text returned.' });
  } catch (error) {
    console.error('Error in chat handler:', error);
    const message = error?.message || 'Unknown upstream error';
    return res.status(500).json({ error: `Request failed: ${message}` });
  }
}
