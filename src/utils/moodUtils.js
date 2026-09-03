/**
 * Utility functions for mood dates and streaks.
 */

// Format a Date object to YYYY-MM-DD
export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayKey() {
  return formatDateKey(new Date());
}

/**
 * Parses YYYY-MM-DD to a local Date object.
 * Safe from timezone shifting issues because we use local components.
 */
export function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Calculate streaks based on a flat dictionary of history entries.
 * historyObject is an object keyed by 'YYYY-MM-DD'.
 */
export function calculateStreaks(historyObject) {
  const keys = Object.keys(historyObject || {});
  
  if (keys.length === 0) {
    return { currentStreak: 0, longestStreak: 0, total: 0 };
  }

  // Ensure sorted by date ascending
  const sortedDates = keys.sort();

  let longestStreak = 0;
  let currentStreak = 0;
  
  if (sortedDates.length === 0) {
    return { currentStreak, longestStreak, total: 0 };
  }

  let tempStreak = 1;
  longestStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = parseDateKey(sortedDates[i - 1]);
    const currDate = parseDateKey(sortedDates[i]);

    // Check if difference is exactly 1 day
    const diffTime = currDate - prevDate;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak += 1;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 1;
    }
  }

  // Calculate current streak
  // A current streak is valid if the last check-in was today or yesterday.
  const today = getTodayKey();
  const lastCheckInDate = sortedDates[sortedDates.length - 1];
  const lastDateObj = parseDateKey(lastCheckInDate);
  const todayObj = parseDateKey(today);

  const diffToToday = Math.round((todayObj - lastDateObj) / (1000 * 60 * 60 * 24));

  if (diffToToday === 0 || diffToToday === 1) {
    currentStreak = tempStreak;
  } else {
    currentStreak = 0;
  }

  return {
    currentStreak,
    longestStreak,
    total: keys.length,
  };
}
