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
          ↑
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
