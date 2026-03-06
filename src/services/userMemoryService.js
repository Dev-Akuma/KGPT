import {
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const EMPTY_MEMORY = {
  traits: [],
  habits: [],
  concerns: [],
  goals: [],
  archetypes: [],
  communication_style: '',
  insights: [],
  memoryEnabled: true,
  updatedAt: null,
};

const MEMORY_DOC_ID = 'memory';

const archetypeRules = [
  {
    name: 'reflective overthinker',
    keywords: ['overthink', 'procrast', 'mistake', 'fear of failure', 'second-guess'],
  },
  {
    name: 'purpose seeker',
    keywords: ['purpose', 'meaning', 'direction', 'lost', 'clarity'],
  },
  {
    name: 'disciplined aspirant',
    keywords: ['routine', 'discipline', 'consistency', 'study plan', 'habit building'],
  },
];

function memoryDocRef(userId) {
  return doc(db, 'users', userId, 'profile', MEMORY_DOC_ID);
}

function uniqueClean(items) {
  return Array.from(
    new Set(
      (items || [])
        .map((item) => `${item || ''}`.trim())
        .filter(Boolean)
        .map((item) => item.toLowerCase()),
    ),
  );
}

function normalizeMemory(input = {}) {
  return {
    traits: uniqueClean(input.traits),
    habits: uniqueClean(input.habits),
    concerns: uniqueClean(input.concerns),
    goals: uniqueClean(input.goals),
    archetypes: uniqueClean(input.archetypes),
    communication_style: `${input.communication_style || ''}`.trim(),
    insights: uniqueClean(input.insights),
    memoryEnabled: input.memoryEnabled !== false,
    updatedAt: input.updatedAt || null,
  };
}

function inferArchetypes(memory) {
  const bag = [
    ...memory.traits,
    ...memory.habits,
    ...memory.concerns,
    ...memory.goals,
    ...memory.insights,
  ].join(' ');

  return archetypeRules
    .filter((rule) => rule.keywords.some((keyword) => bag.includes(keyword)))
    .map((rule) => rule.name);
}

export function mergeUserMemory(existing, incoming) {
  const base = normalizeMemory(existing);
  const next = normalizeMemory(incoming);

  const merged = {
    ...base,
    traits: uniqueClean([...base.traits, ...next.traits]),
    habits: uniqueClean([...base.habits, ...next.habits]),
    concerns: uniqueClean([...base.concerns, ...next.concerns]),
    goals: uniqueClean([...base.goals, ...next.goals]),
    insights: uniqueClean([...base.insights, ...next.insights]),
    communication_style: next.communication_style || base.communication_style,
    memoryEnabled: base.memoryEnabled,
  };

  merged.archetypes = uniqueClean([
    ...base.archetypes,
    ...next.archetypes,
    ...inferArchetypes(merged),
  ]);

  return merged;
}

export async function extractInsightsFromMessage(message) {
  const response = await fetch('/api/memory/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  const rawText = await response.text();
  let data = null;

  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = null;
  }

  if (!response.ok) {
    // If backend route is temporarily unavailable (old server process),
    // skip memory extraction but keep chat flow working.
    if (response.status === 404) {
      return { ...EMPTY_MEMORY };
    }

    throw new Error(data?.error || 'Memory extraction failed.');
  }

  if (!data || typeof data !== 'object') {
    return { ...EMPTY_MEMORY };
  }

  return normalizeMemory(data.insights || {});
}

export function subscribeToUserMemory(userId, onData, onError) {
  return onSnapshot(
    memoryDocRef(userId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData({ ...EMPTY_MEMORY });
        return;
      }

      onData(normalizeMemory(snapshot.data()));
    },
    onError,
  );
}

export async function saveUserMemory(userId, memory) {
  const next = normalizeMemory(memory);

  await setDoc(
    memoryDocRef(userId),
    {
      ...next,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function clearUserMemory(userId) {
  await deleteDoc(memoryDocRef(userId));
}

export async function setMemoryLearningEnabled(userId, enabled) {
  await setDoc(
    memoryDocRef(userId),
    {
      memoryEnabled: Boolean(enabled),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function removeMemoryItem(memory, section, value) {
  if (!Array.isArray(memory?.[section])) {
    return memory;
  }

  const target = `${value || ''}`.trim().toLowerCase();

  return {
    ...memory,
    [section]: memory[section].filter((item) => item.toLowerCase() !== target),
  };
}

export function buildUserProfileContext(memory) {
  const profile = normalizeMemory(memory);

  if (!profile.memoryEnabled) {
    return '';
  }

  const sections = [
    profile.archetypes.length ? `Archetypes: ${profile.archetypes.join(', ')}` : '',
    profile.traits.length ? `Traits: ${profile.traits.join(', ')}` : '',
    profile.habits.length ? `Habits: ${profile.habits.join(', ')}` : '',
    profile.concerns.length ? `Concerns: ${profile.concerns.join(', ')}` : '',
    profile.goals.length ? `Goals: ${profile.goals.join(', ')}` : '',
    profile.communication_style
      ? `Communication style preference: ${profile.communication_style}`
      : '',
    profile.insights.length ? `Additional insights: ${profile.insights.join(', ')}` : '',
  ].filter(Boolean);

  return sections.join('\n');
}

export { EMPTY_MEMORY };
