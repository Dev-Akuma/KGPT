const SessionGreetingCard = ({ greeting }) => {
  if (!greeting) {
    return null;
  }

  return (
    <article className="session-greeting-card" aria-label="Personalized greeting">
      <h2>{greeting.title}</h2>
      <p>{greeting.context}</p>
      <p className="session-greeting-prompt">{greeting.prompt}</p>
    </article>
  );
};

export default SessionGreetingCard;
