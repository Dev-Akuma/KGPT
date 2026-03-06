import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatInput from '../components/ChatInput';
import ChatWindow from '../components/ChatWindow';
import CalmBackground from '../components/CalmBackground';
import { useChatSessions } from '../hooks/useChatSessions';
import { logout } from '../services/authService';
import { useGroqChat } from '../useGroqChat';

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
    createNewChat,
    selectChat,
    sendMessage,
  } = useChatSessions(user);
  const guestChat = useGroqChat();

  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 900 : true,
  );

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

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

  const handleNewChat = async () => {
    if (isAuthenticated) {
      await createNewChat();
      return;
    }

    guestChat.resetChat();
  };

  return (
    <div className={`app-shell ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <CalmBackground />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={currentChats}
        chatsLoading={currentChatsLoading}
        activeConversationId={currentActiveChatId}
        isAuthenticated={isAuthenticated}
        onSelectConversation={(chatId) => {
          selectChat(chatId);
          setIsSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        userEmail={user?.email || 'Temporary chat'}
        onLoginRequest={onOpenLogin}
        onLogout={logout}
      />

      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        role="button"
        tabIndex={0}
        aria-label="Close sidebar overlay"
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            setIsSidebarOpen(false);
          }
        }}
      />

      <main className="main-panel">
        <div className="top-bar">
          <button
            className="menu-btn"
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
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
          />
          <ChatInput value={input} onChange={setInput} onSend={handleSend} loading={isLoading} />
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
