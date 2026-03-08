import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatInput from '../components/ChatInput';
import ChatWindow from '../components/ChatWindow';
import CalmBackground from '../components/CalmBackground';
import UserProfilePanel from '../components/UserProfilePanel';
import UtilityPanel from '../components/UtilityPanel';
import MoodCheckInCard from '../components/MoodCheckInCard';
import { useChatSessions } from '../hooks/useChatSessions';
import { logout } from '../services/authService';
import { useGroqChat } from '../useGroqChat';

const DESKTOP_BREAKPOINT = 1024;
const MOOD_CHECKIN_SESSION_KEY = 'kgpt:mood-checkin-shown';
const BREATHING_SUGGESTION_SESSION_KEY = 'kgpt:breathing-suggestion-shown';
const DAILY_WISDOM_LAST_DATE_KEY = 'kgpt:daily-wisdom-last-date';
const DAILY_WISDOM_SESSION_DATE_KEY = 'kgpt:daily-wisdom-session-date';
const SESSION_GREETING_KEY = 'kgpt:session-greeting-shown';
const STRESS_SIGNAL_PATTERN =
  /stress|stressed|anxious|anxiety|panic|overwhelm|overwhelmed|frustrated|sad|heavy|burnout|drained|tired/i;

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDisplayName(user) {
  const displayName = `${user?.displayName || ''}`.trim();
  if (displayName) {
    return displayName.split(/\s+/)[0];
  }

  const email = `${user?.email || ''}`.trim();
  if (!email) {
    return '';
  }

  const localPart = email.split('@')[0] || '';
  return localPart ? localPart.charAt(0).toUpperCase() + localPart.slice(1) : '';
}

function hasMemorySignals(memory) {
  if (!memory) {
    return false;
  }

  return [
    memory.concerns?.length,
    memory.goals?.length,
    memory.insights?.length,
    memory.traits?.length,
    memory.archetypes?.length,
  ].some(Boolean);
}

function buildSessionGreeting(memory, user) {
  const name = toDisplayName(user);
  const title = name ? `Welcome back, ${name}.` : 'Welcome back.';

  if (!hasMemorySignals(memory)) {
    return {
      title,
      context: 'I am glad you are here again. We can continue from where you left off or begin fresh today.',
      prompt: 'Would you like to continue a previous thread or explore what is present for you right now?',
    };
  }

  const concern = memory.concerns?.[0];
  const goal = memory.goals?.[0];
  const insight = memory.insights?.[0];

  const context = concern
    ? `Last time you mentioned ${concern}.`
    : goal
      ? `You have been working toward ${goal}.`
      : insight
        ? `Last time you shared that ${insight}.`
        : 'I still remember the themes we explored together recently.';

  const prompt = concern
    ? 'Would you like to continue that conversation?'
    : goal
      ? 'Would you like to continue building on that today?'
      : 'Would you like to continue from that point today?';

  return { title, context, prompt };
}

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
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);
  const [showDailyWisdom, setShowDailyWisdom] = useState(false);
  const [sessionGreeting, setSessionGreeting] = useState(null);
  const [showBreathingPrompt, setShowBreathingPrompt] = useState(false);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
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

  useEffect(() => {
    if (typeof window === 'undefined' || memoryLoading) {
      return;
    }

    const hasShownGreeting = window.sessionStorage.getItem(SESSION_GREETING_KEY) === '1';
    if (hasShownGreeting) {
      return;
    }

    setSessionGreeting(buildSessionGreeting(memory, user));
    window.sessionStorage.setItem(SESSION_GREETING_KEY, '1');
  }, [memory, memoryLoading, user]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const hasShownMoodCheckIn = window.sessionStorage.getItem(MOOD_CHECKIN_SESSION_KEY) === '1';
    setShowMoodCheckIn(!hasShownMoodCheckIn);

    const today = getTodayKey();
    const sessionDate = window.sessionStorage.getItem(DAILY_WISDOM_SESSION_DATE_KEY);
    const lastShownDate = window.localStorage.getItem(DAILY_WISDOM_LAST_DATE_KEY);

    if (sessionDate === today || lastShownDate === today) {
      setShowDailyWisdom(false);
      return;
    }

    setShowDailyWisdom(true);
    window.localStorage.setItem(DAILY_WISDOM_LAST_DATE_KEY, today);
    window.sessionStorage.setItem(DAILY_WISDOM_SESSION_DATE_KEY, today);
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

  const handleStarterSelect = useCallback(
    async (starter) => {
      if (!starter || sending || guestChat.loading) {
        return;
      }

      setTypingCompleteToken((previous) => previous + 1);

      if (isAuthenticated) {
        await sendMessage(starter);
        return;
      }

      await guestChat.sendMessage(starter);
    },
    [guestChat, isAuthenticated, sendMessage, sending],
  );

  const markMoodCheckInComplete = useCallback(() => {
    setShowMoodCheckIn(false);

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(MOOD_CHECKIN_SESSION_KEY, '1');
    }
  }, []);

  const handleMoodSelect = useCallback(
    async (messageText) => {
      if (!messageText || sending || guestChat.loading) {
        return;
      }

      markMoodCheckInComplete();
      setTypingCompleteToken((previous) => previous + 1);

      if (isAuthenticated) {
        await sendMessage(messageText);
        return;
      }

      await guestChat.sendMessage(messageText);
    },
    [guestChat, isAuthenticated, markMoodCheckInComplete, sendMessage, sending],
  );

  const isLoading = isAuthenticated ? sending : guestChat.loading;
  const currentMessages = isAuthenticated ? messages : guestChat.messages;
  const currentChats = isAuthenticated ? chats : [];
  const currentChatsLoading = isAuthenticated ? chatsLoading : false;
  const currentActiveChatId = isAuthenticated ? activeChatId : null;
  const currentMessagesLoading = isAuthenticated ? messagesLoading : false;
  const currentError = isAuthenticated ? error : '';

  useEffect(() => {
    if (typeof window === 'undefined' || isBreathingActive || currentMessages.length === 0) {
      return;
    }

    const alreadySuggested =
      window.sessionStorage.getItem(BREATHING_SUGGESTION_SESSION_KEY) === '1';

    if (alreadySuggested) {
      return;
    }

    const lastUserMessage = [...currentMessages]
      .reverse()
      .find((message) => message.role === 'user' && typeof message.content === 'string');

    if (lastUserMessage && STRESS_SIGNAL_PATTERN.test(lastUserMessage.content)) {
      setShowBreathingPrompt(true);
      window.sessionStorage.setItem(BREATHING_SUGGESTION_SESSION_KEY, '1');
    }
  }, [currentMessages, isBreathingActive]);

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

  const handleActivateBreathing = useCallback(() => {
    setShowBreathingPrompt(false);
    setIsBreathingActive(true);
  }, []);

  const handleStopBreathing = useCallback(() => {
    setIsBreathingActive(false);
  }, []);

  const handleDismissDailyWisdom = useCallback(() => {
    setShowDailyWisdom(false);
  }, []);

  useEffect(() => {
    if (currentMessages.length > 0 && sessionGreeting) {
      setSessionGreeting(null);
    }
  }, [currentMessages.length, sessionGreeting]);

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
            onStarterSelect={handleStarterSelect}
            starterDisabled={isLoading}
            showBreathingPrompt={showBreathingPrompt}
            breathingActive={isBreathingActive}
            onActivateBreathing={handleActivateBreathing}
            onStopBreathing={handleStopBreathing}
            showDailyWisdom={showDailyWisdom}
            onDismissDailyWisdom={handleDismissDailyWisdom}
            sessionGreeting={currentMessages.length === 0 ? sessionGreeting : null}
          />
          {showMoodCheckIn ? (
            <MoodCheckInCard disabled={isLoading} onSelectMood={handleMoodSelect} />
          ) : null}
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            loading={isLoading}
            onBreathingRequest={handleActivateBreathing}
          />
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
