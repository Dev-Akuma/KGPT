import React from 'react';

export const MOOD_OPTIONS = [
  { key: 'calm', emoji: '😊', label: 'Calm', message: "I'm feeling calm today." },
  { key: 'neutral', emoji: '😐', label: 'Neutral', message: "I'm feeling neutral today." },
  { key: 'stressed', emoji: '😞', label: 'Stressed', message: "I'm feeling stressed today." },
  { key: 'sad', emoji: '😢', label: 'Sad', message: "I'm feeling sad today." },
  { key: 'frustrated', emoji: '😤', label: 'Frustrated', message: "I'm feeling frustrated today." },
];

const TodayMoodCheckIn = ({ selectedMoodKey, onSaveMood }) => {
  return (
    <section className="today-mood-checkin" aria-label="Today's mood check-in">
      <h3>
        {selectedMoodKey ? (
          <>
            <span aria-hidden="true" style={{ marginRight: '8px' }}>✓</span>
            Today's check-in saved
          </>
        ) : (
          'How are you feeling today?'
        )}
      </h3>
      <p>Take a moment to record how you're feeling today.</p>

      <div className="mood-checkin-options">
        {MOOD_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`mood-checkin-btn ${selectedMoodKey === option.key ? 'selected' : ''}`}
            onClick={() => onSaveMood(option.key)}
            aria-pressed={selectedMoodKey === option.key}
          >
            <span aria-hidden="true">{option.emoji}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default TodayMoodCheckIn;
