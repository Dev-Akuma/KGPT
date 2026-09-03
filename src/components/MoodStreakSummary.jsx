import React from 'react';

const MoodStreakSummary = ({ currentStreak, longestStreak, total }) => {
  return (
    <section className="mood-streak-summary">
      <div className="streak-main">
        <span className="streak-icon" aria-hidden="true">🔥</span>
        <div className="streak-text">
          <strong>{currentStreak} {currentStreak === 1 ? 'day' : 'days'}</strong>
          <span className="streak-subtext">Current check-in streak</span>
        </div>
      </div>
      
      <div className="streak-stats">
        <div className="stat-item">
          <span className="stat-value">{longestStreak}</span>
          <span className="stat-label">Longest streak</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{total}</span>
          <span className="stat-label">Total check-ins</span>
        </div>
      </div>
    </section>
  );
};

export default MoodStreakSummary;
