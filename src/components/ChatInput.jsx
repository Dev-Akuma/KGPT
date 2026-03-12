import { useEffect, useRef } from 'react';

const ChatInput = ({ value, onChange, onSend, loading, onBreathingRequest }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = '0px';
    const nextHeight = Math.min(textareaRef.current.scrollHeight, 180);
    textareaRef.current.style.height = `${nextHeight}px`;
  }, [value]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <form
      className="input-shell"
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
    >
      <div className="input-container">
        <button
          type="button"
          className="input-icon-btn input-add-btn"
          aria-label="Add context"
          disabled={loading}
          title="Add context"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="input-main">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            className="chat-textarea"
            placeholder="Ask anything"
            disabled={loading}
          />
        </div>

        <div className="input-actions">
          {onBreathingRequest ? (
            <button
              type="button"
              className="input-icon-btn input-breath-btn"
              onClick={onBreathingRequest}
              disabled={loading}
              aria-label="Start calm breathing"
              title="Calm Breath"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 4C9 7 7.5 9.8 7.5 12.1C7.5 14.6 9.5 16.5 12 16.5C14.5 16.5 16.5 14.6 16.5 12.1C16.5 9.8 15 7 12 4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 15.5C5.3 14.4 6.8 14 8.2 14.4M20 15.5C18.7 14.4 17.2 14 15.8 14.4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}

          <button
            type="button"
            className="input-icon-btn input-mic-btn"
            disabled={loading}
            aria-label="Use microphone"
            title="Use microphone"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 15C13.6569 15 15 13.6569 15 12V8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8V12C9 13.6569 10.3431 15 12 15Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M12 18V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <button
            className="input-icon-btn send-btn"
            type="submit"
            disabled={loading || !value.trim()}
            aria-label="Send message"
          >
            <svg
              className="send-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="6" y="7" width="2" height="10" rx="1" fill="currentColor" />
              <rect x="11" y="4" width="2" height="16" rx="1" fill="currentColor" />
              <rect x="16" y="9" width="2" height="6" rx="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
