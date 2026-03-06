import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addMessage,
  createChat,
  subscribeToChats,
  subscribeToMessages,
  updateChatTitle,
} from '../services/chatService';

function makeTitleFromMessage(message) {
  return message.trim().slice(0, 40) || 'New Chat';
}

export function useChatSessions(user) {
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const activeChatIdRef = useRef(activeChatId);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!user?.uid) {
      setChats([]);
      setMessages([]);
      setActiveChatId(null);
      setChatsLoading(false);
      setMessagesLoading(false);
      return;
    }

    setChatsLoading(true);

    const unsubscribe = subscribeToChats(
      user.uid,
      (nextChats) => {
        setChats(nextChats);
        setChatsLoading(false);

        setActiveChatId((previous) => {
          if (previous && nextChats.some((chat) => chat.id === previous)) {
            return previous;
          }

          return nextChats[0]?.id || null;
        });
      },
      (snapshotError) => {
        setError(snapshotError.message || 'Failed to load chats.');
        setChatsLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user?.uid || !activeChatId) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    setMessagesLoading(true);

    const unsubscribe = subscribeToMessages(
      user.uid,
      activeChatId,
      (nextMessages) => {
        setMessages(nextMessages);
        setMessagesLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message || 'Failed to load messages.');
        setMessagesLoading(false);
      },
    );

    return unsubscribe;
  }, [user, activeChatId]);

  const createNewChat = useCallback(async () => {
    if (!user?.uid) {
      return null;
    }

    setMessages([]);
    const newChatId = await createChat(user.uid);
    setActiveChatId(newChatId);
    return newChatId;
  }, [user]);

  const selectChat = useCallback((chatId) => {
    setActiveChatId(chatId);
  }, []);

  const sendMessage = useCallback(
    async (rawContent) => {
      const content = rawContent.trim();
      if (!content || !user?.uid || sending) {
        return;
      }

      setError('');
      setSending(true);

      try {
        let chatId = activeChatIdRef.current;
        if (!chatId) {
          chatId = await createNewChat();
        }

        if (!chatId) {
          throw new Error('Unable to create a chat session.');
        }

        await addMessage(user.uid, chatId, 'user', content);

        const activeChat = chats.find((chat) => chat.id === chatId);
        if (activeChat?.title === 'New Chat') {
          await updateChatTitle(user.uid, chatId, makeTitleFromMessage(content));
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: content }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Request failed');
        }

        await addMessage(user.uid, chatId, 'assistant', data.text || 'No response text returned.');
      } catch (requestError) {
        const fallbackMessage = `Error: ${requestError.message || 'Unknown error'}`;
        const chatId = activeChatIdRef.current;

        if (chatId && user?.uid) {
          await addMessage(user.uid, chatId, 'assistant', fallbackMessage);
        }

        setError(fallbackMessage);
      } finally {
        setSending(false);
      }
    },
    [user, sending, createNewChat, chats],
  );

  return {
    chats,
    messages,
    activeChatId,
    chatsLoading,
    messagesLoading,
    sending,
    error,
    createNewChat,
    selectChat,
    sendMessage,
  };
}
