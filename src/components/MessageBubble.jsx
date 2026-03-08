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
  forceCompleteToken = 0,
}) => {
  const isAssistant = role === 'assistant';
  const [fullResponse, setFullResponse] = useState(content || '');
  const [typingText, setTypingText] = useState(isAssistant && shouldAnimate ? '' : content || '');
  const [isTyping, setIsTyping] = useState(Boolean(isAssistant && shouldAnimate && content));
  const animatedRef = useRef(!shouldAnimate);
  const intervalRef = useRef(null);
  const onTypingProgressRef = useRef(onTypingProgress);

  const stopTyping = (nextText) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setTypingText(nextText);
    setIsTyping(false);
    animatedRef.current = true;
  };

  useEffect(() => {
    onTypingProgressRef.current = onTypingProgress;
  }, [onTypingProgress]);

  useEffect(() => {
    if (!isAssistant || !shouldAnimate || !isTyping) {
      return;
    }

    stopTyping(fullResponse);
  }, [forceCompleteToken, fullResponse, isAssistant, isTyping, shouldAnimate]);

  useEffect(() => {
    if (!isAssistant) {
      setFullResponse(content || '');
      setTypingText(content || '');
      setIsTyping(false);
      return;
    }

    if (!content) {
      setFullResponse('');
      setTypingText('');
      setIsTyping(false);
      animatedRef.current = !shouldAnimate;
      return;
    }

    setFullResponse(content);

    if (!shouldAnimate) {
      stopTyping(content);
      return;
    }

    if (animatedRef.current) {
      setTypingText(content);
      setIsTyping(false);
      return;
    }

    let index = 0;
    setTypingText('');
    setIsTyping(true);

    intervalRef.current = setInterval(() => {
      index += 1;
      const nextChunk = content.slice(0, index);
      setTypingText(nextChunk);
      onTypingProgressRef.current?.();

      if (index >= content.length) {
        stopTyping(content);
      }
    }, 20);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [content, isAssistant, shouldAnimate]);

  return (
    <div className={`message-row ${role}`}>
      {isAssistant ? (
        <article className="assistant-message" aria-label="Assistant response">
          <ReactMarkdown remarkPlugins={MARKDOWN_PLUGINS}>{typingText}</ReactMarkdown>
        </article>
      ) : (
        <div className={`message-bubble ${role}`}>{content}</div>
      )}
    </div>
  );
};

export default memo(MessageBubble);
