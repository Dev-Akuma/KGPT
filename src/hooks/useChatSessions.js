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
import {
  buildSemanticContext,
  deleteMemoryEntry,
  embedUserMessage,
  getPinnedMemories,
  processAndStoreMemories,
  searchMemories,
  subscribeToMemories,
} from '../services/memoryStoreService';

const MEMORY_UPDATE_MESSAGE_THRESHOLD = 3; // Lower threshold — delta extraction is cheap
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
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState('');
  const [memory, setMemory] = useState(EMPTY_MEMORY);
  const [memoryLoading, setMemoryLoading] = useState(true);
  const [semanticMemories, setSemanticMemories] = useState([]);
  const [semanticMemoriesLoading, setSemanticMemoriesLoading] = useState(true);

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

  // Subscribe to semantic memories
  useEffect(() => {
    if (!user?.uid) {
      setSemanticMemories([]);
      setSemanticMemoriesLoading(false);
      return;
    }

    setSemanticMemoriesLoading(true);

    const unsubscribe = subscribeToMemories(
      user.uid,
      (nextMemories) => {
        setSemanticMemories(nextMemories);
        setSemanticMemoriesLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message || 'Failed to load semantic memories.');
        setSemanticMemoriesLoading(false);
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
              // Semantic memory: extract delta facts, embed, and store
              try {
                await processAndStoreMemories(
                  user.uid,
                  pendingMemoryMessagesRef.current,
                  semanticMemories,
                );
              } catch (semanticError) {
                console.warn('Semantic memory update failed (non-blocking):', semanticError.message);
              }

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

        // Build context using semantic retrieval
        let userProfileContext = '';
        try {
          const queryEmbedding = await embedUserMessage(content);
          const pinned = getPinnedMemories(semanticMemories);
          const relevant = searchMemories(semanticMemories, queryEmbedding, 10);
          userProfileContext = buildSemanticContext(pinned, relevant);
        } catch (retrievalError) {
          // Fallback to legacy context if semantic retrieval fails
          console.warn('Semantic retrieval failed, using legacy fallback:', retrievalError.message);
          userProfileContext = buildUserProfileContext(latestMemory, content);
        }

        // Build conversation history from recent messages (limit to last 20 for token savings)
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
            history: recentHistory,
            userProfileContext,
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
          
          // Keep the last partial line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (!dataStr) continue;
              
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

        await addMessage(user.uid, chatId, 'assistant', fullText || 'No response text returned.');
        setStreamingMessage('');
      } catch (requestError) {
        setStreamingMessage('');
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
    [user, sending, createNewChat, chats, memory, semanticMemories],
  );

  return {
    chats,
    messages: streamingMessage 
      ? [...messages, { id: 'streaming-active', role: 'assistant', content: streamingMessage }]
      : messages,
    activeChatId,
    chatsLoading,
    messagesLoading,
    sending,
    error,
    memory,
    memoryLoading,
    semanticMemories,
    semanticMemoriesLoading,
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
