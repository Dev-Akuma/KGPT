import { useState } from 'react';

export function useGuestChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');

  const resetChat = () => {
    setMessages([]);
  };

  const sendMessage = async (content) => {
    const userMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setStreamingMessage('');

    try {
      const recentHistory = messages
        .slice(-20)
        .map((msg) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: content,
          history: recentHistory
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
           errorData = await response.json();
        } catch(e) {
           throw new Error('Request failed with status ' + response.status);
        }
        throw new Error(errorData.error || 'Request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data:')) {
            const dataStr = trimmedLine.replace(/^data:\s*/, '').trim();
            if (!dataStr) continue;
            if (dataStr === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                 throw new Error(parsed.error);
              }
              if (parsed.chunk) {
                 fullText += parsed.chunk;
                 setStreamingMessage(fullText);
              }
            } catch (e) {
               // ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: fullText || 'No response text returned.' }]);
      setStreamingMessage('');

    } catch (error) {
      setStreamingMessage('');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const displayMessages = streamingMessage 
    ? [...messages, { id: 'streaming-active', role: 'assistant', content: streamingMessage }]
    : messages;

  return { messages: displayMessages, sendMessage, loading, resetChat };
}
