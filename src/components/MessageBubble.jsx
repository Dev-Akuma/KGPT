import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const MessageBubble = ({ role, content, onTypingProgress }) => {
  const isAssistant = role === 'assistant';
  const [typedContent, setTypedContent] = useState(isAssistant ? '' : content);
  const animatedRef = useRef(false);
  const onTypingProgressRef = useRef(onTypingProgress);

  useEffect(() => {
    onTypingProgressRef.current = onTypingProgress;
  }, [onTypingProgress]);

  useEffect(() => {
    if (!isAssistant) {
      setTypedContent(content);
      return;
    }

    if (!content) {
      setTypedContent('');
      return;
    }

    if (animatedRef.current) {
      setTypedContent(content);
      return;
    }

    let index = 0;
    const intervalId = setInterval(() => {
      index += 3;
      const nextChunk = content.slice(0, index);
      setTypedContent(nextChunk);
      onTypingProgressRef.current?.();

      if (index >= content.length) {
        animatedRef.current = true;
        clearInterval(intervalId);
      }
    }, 14);

    return () => clearInterval(intervalId);
  }, [content, isAssistant]);

  return (
    <div className={`message-row ${role}`}>
      {isAssistant ? (
        <article className="assistant-message" aria-label="Assistant response">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{typedContent}</ReactMarkdown>
        </article>
      ) : (
        <div className={`message-bubble ${role}`}>{content}</div>
      )}
    </div>
  );
};

export default MessageBubble;
