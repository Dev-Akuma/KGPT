import { useEffect, useRef } from 'react';

const ChatInput = ({ value, onChange, onSend, loading }) => {
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
        <div className="input-main">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            className="chat-textarea"
            placeholder="Share your thoughts with KrishnaGPT"
            disabled={loading}
          />
          <button
            className="send-btn"
            type="submit"
            disabled={loading || !value.trim()}
            aria-label="Send message"
          >
            <svg
              className="send-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M7 17L17 7M17 7H9M17 7V15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="input-meta">
          <span className="input-hint">Enter to send • Shift + Enter for new line</span>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
