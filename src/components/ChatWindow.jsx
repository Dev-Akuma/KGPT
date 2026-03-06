import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const ChatWindow = ({ messages, loading }) => {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  return (
    <section className="chat-window" aria-live="polite">
      {messages.length === 0 ? (
        <div className="empty-state">
          <h1>What is on your mind today?</h1>
          <p>
            Share what feels heavy or unclear, and KrishnaGPT will offer calm, reflective
            guidance inspired by timeless wisdom.
          </p>
        </div>
      ) : (
        <div className="message-list">
          {messages.map((message, index) => (
            <MessageBubble key={index} role={message.role} content={message.content} />
          ))}

          {loading ? (
            <div className="message-row assistant">
              <div className="message-bubble assistant loading-bubble">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          ) : null}

          <div ref={endRef} />
        </div>
      )}
    </section>
  );
};

export default ChatWindow;
