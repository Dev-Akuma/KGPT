/**
 * Local storage abstraction for mood tracking.
 * Designed to be easily replaceable with an API/database.
 */
const MOOD_HISTORY_KEY = 'krishnagpt.moodHistory';

/**
 * Gets the raw wrapped storage object or creates a new one.
 * Expected format:
 * {
 *   version: 1,
 *   moods: {
 *     "2026-08-18": { mood: "calm", createdAt: "...", updatedAt: "..." }
 *   }
 * }
 */
function getStorageObject() {
  if (typeof window === 'undefined') return { version: 1, moods: {} };
  
  try {
    const raw = window.localStorage.getItem(MOOD_HISTORY_KEY);
    if (!raw) {
      // Check for legacy array format and migrate it (optional but good practice)
      const legacyRaw = window.localStorage.getItem('kgpt:mood-history');
      if (legacyRaw) {
        const legacyArray = JSON.parse(legacyRaw);
        const migrated = { version: 1, moods: {} };
        const now = new Date().toISOString();
        
        legacyArray.forEach(item => {
          migrated.moods[item.date] = {
            mood: item.mood,
            createdAt: now,
            updatedAt: now
          };
        });
        
        // Clean up legacy
        window.localStorage.removeItem('kgpt:mood-history');
        window.localStorage.setItem(MOOD_HISTORY_KEY, JSON.stringify(migrated));
        return migrated;
      }
      return { version: 1, moods: {} };
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to load mood storage', error);
    return { version: 1, moods: {} };
  }
}

/**
 * Returns all saved moods as a flat dictionary.
 */
export function getAllMoods() {
  const store = getStorageObject();
  return store.moods || {};
}

/**
 * Returns the mood record for a specific YYYY-MM-DD date.
 */
export function getMoodForDate(dateKey) {
  const moods = getAllMoods();
  return moods[dateKey] || null;
}

/**
 * Creates or updates the mood for a specific date.
 */
export function saveMood(dateKey, moodKey) {
  if (typeof window === 'undefined') return getAllMoods();
  
  try {
    const store = getStorageObject();
    if (!store.moods) store.moods = {};

    const existing = store.moods[dateKey];
    const now = new Date().toISOString();

    if (existing) {
      store.moods[dateKey] = {
        ...existing,
        mood: moodKey,
        updatedAt: now,
      };
    } else {
      store.moods[dateKey] = {
        mood: moodKey,
        createdAt: now,
        updatedAt: now,
      };
    }

    window.localStorage.setItem(MOOD_HISTORY_KEY, JSON.stringify(store));
    return store.moods;
  } catch (error) {
    console.error('Failed to save mood', error);
    return getAllMoods();
  }
}

/**
 * Deletes a mood record for a specific date.
 */
export function removeMood(dateKey) {
  if (typeof window === 'undefined') return getAllMoods();
  
  try {
    const store = getStorageObject();
    if (store.moods && store.moods[dateKey]) {
      delete store.moods[dateKey];
      window.localStorage.setItem(MOOD_HISTORY_KEY, JSON.stringify(store));
    }
    return store.moods || {};
  } catch (error) {
    console.error('Failed to remove mood', error);
    return getAllMoods();
  }
}
