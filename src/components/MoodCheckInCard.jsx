const MOOD_OPTIONS = [
  { key: 'calm', emoji: '😊', label: 'Calm', message: "I'm feeling calm today." },
  { key: 'neutral', emoji: '😐', label: 'Neutral', message: "I'm feeling neutral today." },
  { key: 'stressed', emoji: '😞', label: 'Stressed', message: "I'm feeling stressed today." },
  { key: 'sad', emoji: '😢', label: 'Sad', message: "I'm feeling sad today." },
  { key: 'frustrated', emoji: '😤', label: 'Frustrated', message: "I'm feeling frustrated today." },
];

const MoodCheckInCard = ({ disabled, onSelectMood }) => {
  return (
    <section className="mood-checkin-card" aria-label="Daily mood check-in">
      <h2>How are you feeling today?</h2>
      <p>Choose a mood and KrishnaGPT will gently adapt the conversation.</p>

      <div className="mood-checkin-options">
        {MOOD_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            className="mood-checkin-btn"
            onClick={() => onSelectMood(option.message)}
            disabled={disabled}
          >
            <span aria-hidden="true">{option.emoji}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default MoodCheckInCard;
