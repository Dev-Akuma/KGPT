import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Firestore references ──

const memoriesRef = (userId) => collection(db, 'users', userId, 'memories');
const memoryDocRef = (userId, memoryId) => doc(db, 'users', userId, 'memories', memoryId);

// ── Cosine similarity ──

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  return magnitude === 0 ? 0 : dot / magnitude;
}

// ── API helpers ──

async function embedTexts(texts) {
  const response = await fetch('/api/memory/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Embedding request failed');
  }

  const data = await response.json();
  return data.embeddings || [];
}

async function extractDeltaFacts(messages, existingMemories) {
  const response = await fetch('/api/memory/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      existingMemories: existingMemories.map((m) => ({ fact: m.fact })),
    }),
  });

  if (!response.ok) {
    // If extraction fails, don't block the chat — just skip
    if (response.status === 404) {
      return [];
    }
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Delta extraction failed');
  }

  const data = await response.json();
  return data.memories || [];
}

// ── Core functions ──

/**
 * Extract new facts from messages, embed them, and store in Firestore.
 */
export async function processAndStoreMemories(userId, messages, existingMemories) {
  // 1. Extract delta facts
  const newFacts = await extractDeltaFacts(messages, existingMemories);

  if (!newFacts.length) {
    return [];
  }

  // 2. Embed all new facts in a single batch call
  const factTexts = newFacts.map((f) => f.fact);
  const embeddings = await embedTexts(factTexts);

  // 3. Store each fact + embedding in Firestore
  const stored = [];
  for (let i = 0; i < newFacts.length; i++) {
    const entry = {
      fact: newFacts[i].fact,
      category: newFacts[i].category,
      isPinned: newFacts[i].isPinned || false,
      embedding: embeddings[i] || [],
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(memoriesRef(userId), entry);
    stored.push({ id: docRef.id, ...entry });
  }

  return stored;
}

/**
 * Retrieve all memories for a user (for client-side similarity search).
 */
export async function getAllMemories(userId) {
  const q = query(memoriesRef(userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

/**
 * Subscribe to memory changes in real-time.
 */
export function subscribeToMemories(userId, onData, onError) {
  const q = query(memoriesRef(userId), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const memories = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      onData(memories);
    },
    onError,
  );
}

/**
 * Get only pinned memories (always-relevant facts like name, age).
 */
export function getPinnedMemories(memories) {
  return memories.filter((m) => m.isPinned === true);
}

/**
 * Semantic search: find the top-K most relevant memories for a given query embedding.
 */
export function searchMemories(memories, queryEmbedding, topK = 10) {
  if (!queryEmbedding || !memories.length) {
    return [];
  }

  const scored = memories
    .filter((m) => m.embedding && m.embedding.length > 0)
    .map((m) => ({
      ...m,
      score: cosineSimilarity(queryEmbedding, m.embedding),
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

/**
 * Embed the user's current message for retrieval.
 */
export async function embedUserMessage(message) {
  const embeddings = await embedTexts([message]);
  return embeddings[0] || null;
}

/**
 * Delete a specific memory entry.
 */
export async function deleteMemoryEntry(userId, memoryId) {
  await deleteDoc(memoryDocRef(userId, memoryId));
}

/**
 * Build the context string to inject into the system prompt.
 * Combines pinned facts (always included) with semantically retrieved facts.
 */
export function buildSemanticContext(pinnedMemories, relevantMemories) {
  const sections = [];

  // Always-included facts (name, age, communication style, etc.)
  const pinnedFacts = pinnedMemories.map((m) => m.fact).filter(Boolean);
  if (pinnedFacts.length) {
    sections.push(...pinnedFacts);
  }

  // Semantically retrieved facts (ranked by relevance to current message)
  const relevantFacts = relevantMemories
    .filter((m) => !m.isPinned) // Don't duplicate pinned facts
    .map((m) => m.fact)
    .filter(Boolean);

  if (relevantFacts.length) {
    sections.push('');
    sections.push('Relevant context about this user:');
    relevantFacts.forEach((fact) => sections.push(`- ${fact}`));
  }

  return sections.join('\n').trim();
}
