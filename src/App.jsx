import { useMemo, useState } from 'react';
import { useGroqChat } from './useGroqChat';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import './App.css';

const ChatApp = () => {
  const { messages, sendMessage, loading } = useGroqChat();
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 900 : true,
  );
  const [activeConversationId, setActiveConversationId] = useState(1);

  const conversations = useMemo(
    () => [
      { id: 1, title: 'Finding calm during uncertainty' },
      { id: 2, title: 'Balancing duty and rest' },
      { id: 3, title: 'Letting go of outcomes' },
      { id: 4, title: 'Rebuilding confidence gradually' },
    ],
    [],
  );

  const handleSend = () => {
    if (input.trim() && !loading) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div className={`app-shell ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          setActiveConversationId(id);
          setIsSidebarOpen(false);
        }}
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

        <div className="chat-layout">
          <ChatWindow messages={messages} loading={loading} />
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
};

export default ChatApp;
