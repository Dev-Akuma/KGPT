import React from 'react';

const MoodCheckInTrigger = ({ onClick, hasCheckedInToday }) => {
  return (
    <button
      className={`mood-trigger-btn ${hasCheckedInToday ? 'checked-in' : ''}`}
      onClick={onClick}
      aria-label="Mood Check-In"
      title="Mood Check-In"
    >
      <span className="mood-trigger-icon" aria-hidden="true">📅</span>
      <span className="mood-trigger-text">Mood Check-In {hasCheckedInToday ? '✓' : ''}</span>
    </button>
  );
};

export default MoodCheckInTrigger;
