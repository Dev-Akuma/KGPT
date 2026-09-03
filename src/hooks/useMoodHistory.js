import { useState, useCallback, useEffect } from 'react';
import { getAllMoods, saveMood as saveMoodToStore, removeMood as removeMoodFromStore } from '../services/moodService';
import { calculateStreaks, getTodayKey } from '../utils/moodUtils';

export function useMoodHistory() {
  const [moodHistory, setMoodHistory] = useState({});
  const [stats, setStats] = useState({ currentStreak: 0, longestStreak: 0, total: 0 });
  const [todayMood, setTodayMood] = useState(null);

  const loadHistory = useCallback(() => {
    const history = getAllMoods();
    setMoodHistory(history);
    
    const todayKey = getTodayKey();
    if (history[todayKey]) {
      setTodayMood(history[todayKey].mood);
    } else {
      setTodayMood(null);
    }
    
    setStats(calculateStreaks(history));
  }, []);

  // Initial load
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const saveMood = useCallback((moodKey) => {
    const todayKey = getTodayKey();
    const updatedHistory = saveMoodToStore(todayKey, moodKey);
    
    setMoodHistory(updatedHistory);
    setTodayMood(moodKey);
    setStats(calculateStreaks(updatedHistory));
  }, []);

  const removeMood = useCallback((dateKey) => {
    const updatedHistory = removeMoodFromStore(dateKey);
    setMoodHistory(updatedHistory);
    
    const todayKey = getTodayKey();
    if (dateKey === todayKey) {
      setTodayMood(null);
    }
    
    setStats(calculateStreaks(updatedHistory));
  }, []);

  return {
    moodHistory,
    todayMood,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    total: stats.total,
    saveMood,
    removeMood,
    refreshHistory: loadHistory
  };
}
