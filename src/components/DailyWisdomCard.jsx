const DailyWisdomCard = ({ onDismiss }) => {
  return (
    <article className="daily-wisdom-card" aria-label="Daily wisdom reflection">
      <div className="daily-wisdom-header">
        <h2>Today's Reflection</h2>
        <button type="button" onClick={onDismiss} className="daily-wisdom-dismiss-btn">
          Hide
        </button>
      </div>

      <blockquote>
        "You have a right to perform your actions, but not to the fruits of those actions."
      </blockquote>
      <p className="daily-wisdom-source">- Bhagavad Gita 2.47</p>
      <p className="daily-wisdom-prompt">
        How might this apply to something you're experiencing today?
      </p>
    </article>
  );
};

export default DailyWisdomCard;
