import React from 'react';
import TodayMoodCheckIn from './TodayMoodCheckIn';
import MoodStreakSummary from './MoodStreakSummary';
import MoodCalendar from './MoodCalendar';
import { useMoodHistory } from '../hooks/useMoodHistory';

const MoodCheckInPanel = ({ isOpen, onClose }) => {
  const { 
    moodHistory, 
    todayMood, 
    currentStreak, 
    longestStreak, 
    total, 
    saveMood 
  } = useMoodHistory();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="profile-panel-overlay mood-panel-overlay" role="presentation" onClick={onClose}>
      <aside
        className="profile-panel mood-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Mood Check-In"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-panel-header">
          <h2>Mood Check-In</h2>
          <button type="button" className="profile-panel-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="mood-panel-content">
          <TodayMoodCheckIn 
            selectedMoodKey={todayMood}
            onSaveMood={saveMood}
          />
          
          <MoodStreakSummary 
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            total={total}
          />
          
          <MoodCalendar history={moodHistory} />
        </div>
      </aside>
    </div>
  );
};

export default MoodCheckInPanel;
