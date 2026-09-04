import { memo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const MARKDOWN_PLUGINS = [remarkGfm, remarkBreaks];

const MessageBubble = ({
  role,
  content,
  onTypingProgress,
}) => {
  const isAssistant = role === 'assistant';

  // Trigger scroll update when content length changes (during streaming)
  useEffect(() => {
    if (isAssistant && onTypingProgress) {
      onTypingProgress();
    }
  }, [content, isAssistant, onTypingProgress]);

  return (
    <div className={`message-row ${role}`}>
      {isAssistant ? (
        <article className="assistant-message" aria-label="Assistant response">
          <ReactMarkdown remarkPlugins={MARKDOWN_PLUGINS}>{content || ''}</ReactMarkdown>
        </article>
      ) : (
        <div className={`message-bubble ${role}`}>{content}</div>
      )}
    </div>
  );
};

export default memo(MessageBubble);
