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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.MISTRAL_API_KEY) {
    return res.status(500).json({ error: 'Missing MISTRAL_API_KEY' });
  }

  const { texts } = normalizeBody(req);

  // Accept a single string or an array of strings
  const inputTexts = Array.isArray(texts)
    ? texts.map((t) => `${t || ''}`.trim()).filter(Boolean)
    : typeof texts === 'string' && texts.trim()
      ? [texts.trim()]
      : [];

  if (!inputTexts.length) {
    return res.status(400).json({ error: 'A non-empty "texts" string or array is required.' });
  }

  try {
    // Call Mistral embedding API directly (the AI SDK doesn't wrap embeddings)
    const response = await fetch('https://api.mistral.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: inputTexts,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.message || data?.error?.message || 'Embedding request failed';
      return res.status(response.status).json({ error: message });
    }

    // Return embeddings in the same order as input
    const embeddings = (data.data || [])
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);

    return res.status(200).json({ embeddings });
  } catch (error) {
    const message = error?.message || 'Unknown embedding error';
    return res.status(500).json({ error: `Embedding failed: ${message}` });
  }
}
