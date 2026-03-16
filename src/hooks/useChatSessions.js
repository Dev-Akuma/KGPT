import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addMessage,
  createChat,
  deleteChat,
  subscribeToChats,
  subscribeToMessages,
  updateChatTitle,
} from '../services/chatService';
import {
  buildUserProfileContext,
  clearUserMemory,
  EMPTY_MEMORY,
  extractInsightsFromMessages,
  mergeUserMemory,
  removeMemoryItem,
  saveUserMemory,
  setMemoryLearningEnabled,
  subscribeToUserMemory,
} from '../services/userMemoryService';

const MEMORY_UPDATE_MESSAGE_THRESHOLD = 10;
const MEMORY_UPDATE_MESSAGE_WINDOW = 10;

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
  const [memory, setMemory] = useState(EMPTY_MEMORY);
  const [memoryLoading, setMemoryLoading] = useState(true);

  const activeChatIdRef = useRef(activeChatId);
  const pendingMemoryMessagesRef = useRef([]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    pendingMemoryMessagesRef.current = [];
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setChats([]);
      setMessages([]);
      setActiveChatId(null);
      setChatsLoading(false);
      setMessagesLoading(false);
      setMemory(EMPTY_MEMORY);
      setMemoryLoading(false);
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
    if (!user?.uid) {
      setMemory(EMPTY_MEMORY);
      setMemoryLoading(false);
      return;
    }

    setMemoryLoading(true);

    const unsubscribe = subscribeToUserMemory(
      user.uid,
      (nextMemory) => {
        setMemory(nextMemory);
        setMemoryLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message || 'Failed to load profile memory.');
        setMemoryLoading(false);
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

  const deleteChatSession = useCallback(
    async (chatId) => {
      if (!user?.uid || !chatId) {
        return;
      }

      setError('');

      const remainingChats = chats.filter((chat) => chat.id !== chatId);
      const fallbackChatId = remainingChats[0]?.id || null;

      if (activeChatIdRef.current === chatId) {
        setMessages([]);
        setActiveChatId(fallbackChatId);
      }

      await deleteChat(user.uid, chatId);
    },
    [chats, user],
  );

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

        let latestMemory = memory;

        if (memory.memoryEnabled !== false) {
          try {
            pendingMemoryMessagesRef.current = [
              ...pendingMemoryMessagesRef.current,
              content,
            ].slice(-MEMORY_UPDATE_MESSAGE_WINDOW);

            if (pendingMemoryMessagesRef.current.length >= MEMORY_UPDATE_MESSAGE_THRESHOLD) {
              const extracted = await extractInsightsFromMessages(
                pendingMemoryMessagesRef.current,
                memory,
                MEMORY_UPDATE_MESSAGE_WINDOW,
              );

              latestMemory = mergeUserMemory(memory, extracted);
              await saveUserMemory(user.uid, latestMemory);
              setMemory(latestMemory);
              pendingMemoryMessagesRef.current = [];
            }
          } catch (memoryError) {
            setError(memoryError.message || 'Unable to update profile memory.');
          }
        }

        const activeChat = chats.find((chat) => chat.id === chatId);
        if (activeChat?.title === 'New Chat') {
          await updateChatTitle(user.uid, chatId, makeTitleFromMessage(content));
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: content,
            userProfileContext: buildUserProfileContext(latestMemory, content),
          }),
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
    [user, sending, createNewChat, chats, memory],
  );

  return {
    chats,
    messages,
    activeChatId,
    chatsLoading,
    messagesLoading,
    sending,
    error,
    memory,
    memoryLoading,
    createNewChat,
    selectChat,
    deleteChat: deleteChatSession,
    sendMessage,
    addManualMemoryItem: async (section, value) => {
      if (!user?.uid || !Array.isArray(memory?.[section])) {
        return;
      }

      const nextMemory = mergeUserMemory(memory, { [section]: [value] });
      setMemory(nextMemory);
      await saveUserMemory(user.uid, nextMemory);
    },
    removeMemoryItem: async (section, value) => {
      if (!user?.uid) {
        return;
      }

      const nextMemory = removeMemoryItem(memory, section, value);
      setMemory(nextMemory);
      await saveUserMemory(user.uid, nextMemory);
    },
    updateCommunicationStyle: async (value) => {
      if (!user?.uid) {
        return;
      }

      const nextMemory = {
        ...memory,
        communication_style: value.trim(),
      };

      setMemory(nextMemory);
      await saveUserMemory(user.uid, nextMemory);
    },
    clearMemory: async () => {
      if (!user?.uid) {
        return;
      }

      await clearUserMemory(user.uid);
      setMemory(EMPTY_MEMORY);
    },
    toggleMemoryLearning: async (enabled) => {
      if (!user?.uid) {
        return;
      }

      await setMemoryLearningEnabled(user.uid, enabled);
      setMemory((previous) => ({
        ...previous,
        memoryEnabled: enabled,
      }));
    },
  };
}
