import {
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const MAX_EPHEMERAL_ITEMS = 25;

const EMPTY_MEMORY = {
  core_essence: {
    name: '',
    age: '',
    core_values: [],
    life_goals: [],
    major_past_traumas: [],
  },
  ecosystem: [],
  shadow_work: {
    recurring_anxieties: [],
    recurring_fears: [],
    insecurities: [],
    inferiority_triggers: [],
  },
  daily_routine: {
    current_projects: [],
    daily_habits: [],
    health_status: [],
    current_focus: [],
  },
  ephemeral: {
    fragments: [],
  },
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
  const seen = new Set();

  return (items || [])
    .map((item) => `${item || ''}`.trim())
    .filter(Boolean)
    .filter((item) => {
      const normalized = item.toLowerCase();
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
}

function normalizeStringList(items) {
  return uniqueClean(items);
}

function normalizeCoreEssence(input = {}) {
  return {
    name: `${input.name || ''}`.trim(),
    age: `${input.age || ''}`.trim(),
    core_values: normalizeStringList(input.core_values),
    life_goals: normalizeStringList(input.life_goals),
    major_past_traumas: normalizeStringList(input.major_past_traumas),
  };
}

function normalizeEcosystem(input = []) {
  const mapByName = new Map();

  (Array.isArray(input) ? input : []).forEach((entry) => {
    const name = `${entry?.name || ''}`.trim();
    if (!name) {
      return;
    }

    const key = name.toLowerCase();
    mapByName.set(key, {
      name,
      relation: `${entry?.relation || ''}`.trim(),
      sentiment: `${entry?.sentiment || ''}`.trim(),
      notes: normalizeStringList(entry?.notes),
    });
  });

  return Array.from(mapByName.values());
}

function normalizeShadowWork(input = {}) {
  return {
    recurring_anxieties: normalizeStringList(input.recurring_anxieties),
    recurring_fears: normalizeStringList(input.recurring_fears),
    insecurities: normalizeStringList(input.insecurities),
    inferiority_triggers: normalizeStringList(input.inferiority_triggers),
  };
}

function normalizeDailyRoutine(input = {}) {
  return {
    current_projects: normalizeStringList(input.current_projects),
    daily_habits: normalizeStringList(input.daily_habits),
    health_status: normalizeStringList(input.health_status),
    current_focus: normalizeStringList(input.current_focus),
  };
}

function normalizeEphemeral(input = {}) {
  return {
    fragments: normalizeStringList(input.fragments).slice(-MAX_EPHEMERAL_ITEMS),
  };
}

function mergeStringLists(baseList, nextList) {
  return normalizeStringList([...(baseList || []), ...(nextList || [])]);
}

function deriveLegacySections(profile) {
  const traits = normalizeStringList(profile.core_essence.core_values);
  const habits = normalizeStringList(profile.daily_routine.daily_habits);
  const concerns = normalizeStringList([
    ...profile.shadow_work.recurring_anxieties,
    ...profile.shadow_work.recurring_fears,
    ...profile.shadow_work.insecurities,
    ...profile.shadow_work.inferiority_triggers,
  ]);
  const goals = normalizeStringList([
    ...profile.core_essence.life_goals,
    ...profile.daily_routine.current_projects,
    ...profile.daily_routine.current_focus,
  ]);
  const insights = normalizeStringList(profile.ephemeral.fragments);

  return {
    traits,
    habits,
    concerns,
    goals,
    insights,
  };
}

function fromLegacySections(input = {}) {
  return {
    core_essence: normalizeCoreEssence({
      name: input?.core_essence?.name,
      age: input?.core_essence?.age,
      core_values: [...(input?.core_essence?.core_values || []), ...(input?.traits || [])],
      life_goals: [...(input?.core_essence?.life_goals || []), ...(input?.goals || [])],
      major_past_traumas: input?.core_essence?.major_past_traumas || [],
    }),
    ecosystem: normalizeEcosystem(input?.ecosystem || []),
    shadow_work: normalizeShadowWork({
      recurring_anxieties: [
        ...(input?.shadow_work?.recurring_anxieties || []),
        ...(input?.concerns || []),
      ],
      recurring_fears: input?.shadow_work?.recurring_fears || [],
      insecurities: input?.shadow_work?.insecurities || [],
      inferiority_triggers: input?.shadow_work?.inferiority_triggers || [],
    }),
    daily_routine: normalizeDailyRoutine({
      current_projects: input?.daily_routine?.current_projects || [],
      daily_habits: [...(input?.daily_routine?.daily_habits || []), ...(input?.habits || [])],
      health_status: input?.daily_routine?.health_status || [],
      current_focus: input?.daily_routine?.current_focus || [],
    }),
    ephemeral: normalizeEphemeral({
      fragments: [...(input?.ephemeral?.fragments || []), ...(input?.insights || [])],
    }),
  };
}

function normalizeMemory(input = {}) {
  const modular = fromLegacySections(input);
  const legacy = deriveLegacySections(modular);

  return Array.from(
    new Set(
      normalizeStringList(input.archetypes || []).concat(
        inferArchetypes({
          ...legacy,
          archetypes: normalizeStringList(input.archetypes || []),
        }),
      ),
    ),
  );
}

function normalizeProfile(input = {}) {
  const modular = fromLegacySections(input);
  const legacy = deriveLegacySections(modular);

  return {
    ...modular,
    traits: legacy.traits,
    habits: legacy.habits,
    concerns: legacy.concerns,
    goals: legacy.goals,
    insights: legacy.insights,
    archetypes: normalizeMemory(input),
    communication_style: `${input.communication_style || ''}`.trim(),
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
  const base = normalizeProfile(existing);
  const next = normalizeProfile(incoming);

  const mergedCoreEssence = {
    name: next.core_essence.name || base.core_essence.name,
    age: next.core_essence.age || base.core_essence.age,
    core_values: mergeStringLists(base.core_essence.core_values, next.core_essence.core_values),
    life_goals: mergeStringLists(base.core_essence.life_goals, next.core_essence.life_goals),
    major_past_traumas: mergeStringLists(
      base.core_essence.major_past_traumas,
      next.core_essence.major_past_traumas,
    ),
  };

  const ecosystemMap = new Map();
  [...base.ecosystem, ...next.ecosystem].forEach((entry) => {
    const key = `${entry.name || ''}`.trim().toLowerCase();
    if (!key) {
      return;
    }

    const previous = ecosystemMap.get(key) || {
      name: entry.name,
      relation: '',
      sentiment: '',
      notes: [],
    };

    ecosystemMap.set(key, {
      name: entry.name || previous.name,
      relation: entry.relation || previous.relation,
      sentiment: entry.sentiment || previous.sentiment,
      notes: mergeStringLists(previous.notes, entry.notes),
    });
  });

  const mergedShadowWork = {
    recurring_anxieties: mergeStringLists(
      base.shadow_work.recurring_anxieties,
      next.shadow_work.recurring_anxieties,
    ),
    recurring_fears: mergeStringLists(base.shadow_work.recurring_fears, next.shadow_work.recurring_fears),
    insecurities: mergeStringLists(base.shadow_work.insecurities, next.shadow_work.insecurities),
    inferiority_triggers: mergeStringLists(
      base.shadow_work.inferiority_triggers,
      next.shadow_work.inferiority_triggers,
    ),
  };

  const mergedDailyRoutine = {
    current_projects: mergeStringLists(
      base.daily_routine.current_projects,
      next.daily_routine.current_projects,
    ),
    daily_habits: mergeStringLists(base.daily_routine.daily_habits, next.daily_routine.daily_habits),
    health_status: mergeStringLists(base.daily_routine.health_status, next.daily_routine.health_status),
    current_focus: mergeStringLists(base.daily_routine.current_focus, next.daily_routine.current_focus),
  };

  const mergedEphemeral = {
    fragments: mergeStringLists(base.ephemeral.fragments, next.ephemeral.fragments).slice(-MAX_EPHEMERAL_ITEMS),
  };

  return normalizeProfile({
    core_essence: mergedCoreEssence,
    ecosystem: Array.from(ecosystemMap.values()),
    shadow_work: mergedShadowWork,
    daily_routine: mergedDailyRoutine,
    ephemeral: mergedEphemeral,
    archetypes: mergeStringLists(base.archetypes, next.archetypes),
    communication_style: next.communication_style || base.communication_style,
    memoryEnabled: base.memoryEnabled,
  });
}

export async function extractInsightsFromMessages(messages, userProfile, messageLimit = 10) {
  const normalizedMessages = (Array.isArray(messages) ? messages : [])
    .map((item) => `${item || ''}`.trim())
    .filter(Boolean)
    .slice(-Math.max(1, messageLimit));

  if (!normalizedMessages.length) {
    return { ...EMPTY_MEMORY };
  }

  const response = await fetch('/api/memory/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: normalizedMessages,
      userProfile: normalizeProfile(userProfile || {}),
      messageLimit,
    }),
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

  const profilePayload = data.profile || data.insights || {};
  return normalizeProfile(profilePayload);
}

export async function extractInsightsFromMessage(message) {
  return extractInsightsFromMessages([message], {}, 1);
}

export function subscribeToUserMemory(userId, onData, onError) {
  return onSnapshot(
    memoryDocRef(userId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData({ ...EMPTY_MEMORY });
        return;
      }

      onData(normalizeProfile(snapshot.data()));
    },
    onError,
  );
}

export async function saveUserMemory(userId, memory) {
  const next = normalizeProfile(memory);

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
  const target = `${value || ''}`.trim().toLowerCase();
  const next = normalizeProfile(memory);

  const filterTarget = (items) =>
    normalizeStringList(items).filter((item) => item.toLowerCase() !== target);

  if (section === 'traits') {
    next.core_essence.core_values = filterTarget(next.core_essence.core_values);
  } else if (section === 'habits') {
    next.daily_routine.daily_habits = filterTarget(next.daily_routine.daily_habits);
  } else if (section === 'concerns') {
    next.shadow_work.recurring_anxieties = filterTarget(next.shadow_work.recurring_anxieties);
    next.shadow_work.recurring_fears = filterTarget(next.shadow_work.recurring_fears);
    next.shadow_work.insecurities = filterTarget(next.shadow_work.insecurities);
    next.shadow_work.inferiority_triggers = filterTarget(next.shadow_work.inferiority_triggers);
  } else if (section === 'goals') {
    next.core_essence.life_goals = filterTarget(next.core_essence.life_goals);
    next.daily_routine.current_projects = filterTarget(next.daily_routine.current_projects);
    next.daily_routine.current_focus = filterTarget(next.daily_routine.current_focus);
  } else if (section === 'insights') {
    next.ephemeral.fragments = filterTarget(next.ephemeral.fragments);
  } else if (Array.isArray(next[section])) {
    next[section] = filterTarget(next[section]);
  }

  return normalizeProfile(next);
}

export function buildUserProfileContext(memory, inputText = '') {
  const profile = normalizeProfile(memory);

  if (!profile.memoryEnabled) {
    return '';
  }

  const text = `${inputText || ''}`.toLowerCase();
  const mentionPeople = /(friend|friends|family|mother|father|mom|dad|brother|sister|partner|wife|husband|boss|coworker|colleague)/i.test(text);
  const mentionShadow = /(anxious|anxiety|fear|afraid|insecure|inferior|overthink|panic|stress|stressed|sad|overwhelmed|burnout)/i.test(text);
  const mentionRoutine = /(habit|routine|schedule|gym|health|sleep|workout|project|study|career|plan)/i.test(text);
  const mentionEphemeral = /(today|currently|right now|this week|recently)/i.test(text);

  const sections = [
    profile.core_essence.name ? `Name: ${profile.core_essence.name}` : '',
    profile.core_essence.age ? `Age: ${profile.core_essence.age}` : '',
    profile.core_essence.core_values.length
      ? `Core values: ${profile.core_essence.core_values.join(', ')}`
      : '',
    profile.core_essence.life_goals.length
      ? `Life goals: ${profile.core_essence.life_goals.join(', ')}`
      : '',
    mentionShadow && profile.shadow_work.recurring_anxieties.length
      ? `Recurring anxieties: ${profile.shadow_work.recurring_anxieties.join(', ')}`
      : '',
    mentionShadow && profile.shadow_work.inferiority_triggers.length
      ? `Inferiority triggers: ${profile.shadow_work.inferiority_triggers.join(', ')}`
      : '',
    mentionRoutine && profile.daily_routine.current_projects.length
      ? `Current projects: ${profile.daily_routine.current_projects.join(', ')}`
      : '',
    mentionRoutine && profile.daily_routine.daily_habits.length
      ? `Daily habits: ${profile.daily_routine.daily_habits.join(', ')}`
      : '',
    mentionPeople && profile.ecosystem.length
      ? `Important people: ${profile.ecosystem.map((person) => person.name).join(', ')}`
      : '',
    profile.archetypes.length ? `Archetypes: ${profile.archetypes.join(', ')}` : '',
    profile.communication_style
      ? `Communication style preference: ${profile.communication_style}`
      : '',
    mentionEphemeral && profile.ephemeral.fragments.length
      ? `Recent ephemeral fragments: ${profile.ephemeral.fragments.join(', ')}`
      : '',
  ].filter(Boolean);

  return sections.join('\n');
}

export { EMPTY_MEMORY };
