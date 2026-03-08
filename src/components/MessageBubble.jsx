import { memo, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const MARKDOWN_PLUGINS = [remarkGfm, remarkBreaks];

const MessageBubble = ({
  role,
  content,
  shouldAnimate = false,
  onTypingProgress,
}) => {
  const isAssistant = role === 'assistant';
  const [typedContent, setTypedContent] = useState(
    isAssistant && shouldAnimate ? '' : content,
  );
  const animatedRef = useRef(!shouldAnimate);
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
      animatedRef.current = !shouldAnimate;
      return;
    }

    if (!shouldAnimate) {
      setTypedContent(content);
      animatedRef.current = true;
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
  }, [content, isAssistant, shouldAnimate]);

  return (
    <div className={`message-row ${role}`}>
      {isAssistant ? (
        <article className="assistant-message" aria-label="Assistant response">
          <ReactMarkdown remarkPlugins={MARKDOWN_PLUGINS}>{typedContent}</ReactMarkdown>
        </article>
      ) : (
        <div className={`message-bubble ${role}`}>{content}</div>
      )}
    </div>
  );
};

export default memo(MessageBubble);
