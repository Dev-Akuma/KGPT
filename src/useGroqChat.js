import { useState } from 'react';

export function useGroqChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const resetChat = () => {
    setMessages([]);
  };

  const sendMessage = async (content) => {
    const userMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading, resetChat };
}
