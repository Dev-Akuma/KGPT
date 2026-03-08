import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatInput from '../components/ChatInput';
import ChatWindow from '../components/ChatWindow';
import CalmBackground from '../components/CalmBackground';
import UserProfilePanel from '../components/UserProfilePanel';
import UtilityPanel from '../components/UtilityPanel';
import { useChatSessions } from '../hooks/useChatSessions';
import { logout } from '../services/authService';
import { useGroqChat } from '../useGroqChat';

const DESKTOP_BREAKPOINT = 1024;

const ChatPage = ({ user, onOpenLogin }) => {
  const isAuthenticated = Boolean(user?.uid);
  const {
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
    deleteChat,
    sendMessage,
    addManualMemoryItem,
    removeMemoryItem,
    updateCommunicationStyle,
    clearMemory,
    toggleMemoryLearning,
  } = useChatSessions(user);
  const guestChat = useGroqChat();

  const [input, setInput] = useState('');
  const [activeUtilityPanel, setActiveUtilityPanel] = useState(null);
  const [typingCompleteToken, setTypingCompleteToken] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : true,
  );
  const [isDesktopViewport, setIsDesktopViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : true,
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const syncLayout = (event) => {
      const desktop = event.matches;
      setIsDesktopViewport(desktop);

      // Keep sidebar pinned open on desktop, collapsible on smaller screens.
      if (desktop) {
        setIsSidebarOpen(true);
      }
    };

    syncLayout(mediaQuery);
    mediaQuery.addEventListener('change', syncLayout);
    return () => mediaQuery.removeEventListener('change', syncLayout);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    // Finish any in-progress assistant typing animation before sending the next prompt.
    setTypingCompleteToken((previous) => previous + 1);

    const content = input;
    setInput('');

    if (isAuthenticated) {
      if (sending) {
        return;
      }
      await sendMessage(content);
      return;
    }

    await guestChat.sendMessage(content);
  };

  const isLoading = isAuthenticated ? sending : guestChat.loading;
  const currentMessages = isAuthenticated ? messages : guestChat.messages;
  const currentChats = isAuthenticated ? chats : [];
  const currentChatsLoading = isAuthenticated ? chatsLoading : false;
  const currentActiveChatId = isAuthenticated ? activeChatId : null;
  const currentMessagesLoading = isAuthenticated ? messagesLoading : false;
  const currentError = isAuthenticated ? error : '';

  const handleNewChat = useCallback(async () => {
    if (isAuthenticated) {
      await createNewChat();
      if (!isDesktopViewport) {
        setIsSidebarOpen(false);
      }
      return;
    }

    guestChat.resetChat();
    if (!isDesktopViewport) {
      setIsSidebarOpen(false);
    }
  }, [createNewChat, guestChat, isAuthenticated, isDesktopViewport]);

  const handleSelectConversation = useCallback(
    (chatId) => {
      selectChat(chatId);
      if (!isDesktopViewport) {
        setIsSidebarOpen(false);
      }
    },
    [isDesktopViewport, selectChat],
  );

  const handleDeleteConversation = useCallback(
    async (chatId) => {
      await deleteChat(chatId);
    },
    [deleteChat],
  );

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const openUtilityPanel = useCallback((panelKey) => {
    setActiveUtilityPanel(panelKey);
  }, []);

  const closeUtilityPanel = useCallback(() => {
    setActiveUtilityPanel(null);
  }, []);

  return (
    <div className={`app-shell ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <CalmBackground />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        conversations={currentChats}
        chatsLoading={currentChatsLoading}
        activeConversationId={currentActiveChatId}
        isAuthenticated={isAuthenticated}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onNewChat={handleNewChat}
        userEmail={user?.email || 'Temporary chat'}
        userName={user?.displayName || ''}
        userPhotoUrl={user?.photoURL || ''}
        onLoginRequest={onOpenLogin}
        onOpenSettings={() => openUtilityPanel('settings')}
        onOpenPersonalization={() => openUtilityPanel('personalization')}
        onOpenUpgrade={() => openUtilityPanel('upgrade')}
        onOpenHelp={() => openUtilityPanel('help')}
        onLogout={logout}
      />

      <div
        className={`sidebar-overlay ${isSidebarOpen && !isDesktopViewport ? 'show' : ''}`}
        onClick={closeSidebar}
        role="button"
        tabIndex={0}
        aria-label="Close sidebar overlay"
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            closeSidebar();
          }
        }}
      />

      <main className="main-panel">
        <div className="top-bar">
          <button
            className="menu-btn"
            type="button"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={isSidebarOpen}
            aria-controls="kgpt-sidebar"
          >
            ☰
          </button>
          <div className="top-title">KrishnaGPT</div>
        </div>

        {!isAuthenticated ? (
          <div className="chat-guest-banner">
            Temporary chat mode: messages are not saved. Sign in from the sidebar to keep history.
          </div>
        ) : null}

        {currentError ? <div className="chat-error-banner">{currentError}</div> : null}

        <div className="chat-layout">
          <ChatWindow
            messages={currentMessages}
            loading={isLoading}
            messagesLoading={currentMessagesLoading}
            activeChatId={currentActiveChatId}
            forceCompleteToken={typingCompleteToken}
          />
          <ChatInput value={input} onChange={setInput} onSend={handleSend} loading={isLoading} />
        </div>
      </main>

      {isAuthenticated && activeUtilityPanel === 'personalization' ? (
        <UserProfilePanel
          isOpen
          onClose={closeUtilityPanel}
          title="Personalization"
          memory={memory}
          memoryLoading={memoryLoading}
          onAddItem={addManualMemoryItem}
          onRemoveItem={removeMemoryItem}
          onUpdateCommunicationStyle={updateCommunicationStyle}
          onToggleMemoryLearning={toggleMemoryLearning}
          onClearMemory={clearMemory}
        />
      ) : null}

      {isAuthenticated && activeUtilityPanel && activeUtilityPanel !== 'personalization' ? (
        <UtilityPanel
          panelKey={activeUtilityPanel}
          onClose={closeUtilityPanel}
        />
      ) : null}
    </div>
  );
};

export default ChatPage;
