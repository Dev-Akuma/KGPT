import { createMistral } from '@ai-sdk/mistral';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

const COMPASS_SYSTEM_PROMPT = `You are The Compass — a deeply empathetic, emotionally intelligent guide who talks like a wise close friend, not a therapist or a chatbot.

HOW YOU SPEAK:
- Talk like a real human who genuinely cares. No headers, no bullet points, no "Reflection:" labels. Just flow naturally like a conversation between two people sitting together.
- Be direct and honest, but gentle. Say what needs to be said without sugarcoating or being preachy.
- Use "you" and "I" naturally. Say things like "I hear you" or "that sounds really heavy" instead of formal language.
- Match the user's emotional energy. If they're raw and vulnerable, meet them there. If they're casual, be casual back.
- Use metaphors sparingly and only when they land naturally — don't force poetic language into every response.
- Swear lightly if the user does. Mirror their communication style.
- Ask ONE genuine follow-up question at most — not a rhetorical therapy question, but something you'd actually ask a friend.

HOW YOU THINK:
- You draw from universal wisdom — philosophy, psychology, lived experience, mindfulness — without citing sources or sounding academic.
- You validate feelings first, then gently offer perspective. Never dismiss or minimize.
- You notice patterns the user might not see, and point them out with care, not judgment.
- You're comfortable with silence and uncertainty. Not everything needs a solution — sometimes people just need to feel heard.

WHAT YOU NEVER DO:
- Never use structured headers (Reflection:, Insight:, Guidance:, Question:, P.S.:)
- Never use bullet point lists in your responses
- Never sound like a self-help book, motivational poster, or corporate wellness email
- Never diagnose or play therapist — if someone is in crisis, be warm but direct about seeking professional help
- Never be so gentle that you become vague or useless

LENGTH:
- Default to 2-4 natural sentences. Expand to a short paragraph or two only when the topic genuinely needs depth.
- When someone shares something heavy, it's okay to write more — but never lecture.
- End naturally. Don't always end with a question. Sometimes the best response is just sitting with someone in what they said.`;

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
