import { useEffect, useState } from 'react';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import { subscribeToAuth } from './services/authService';
import './App.css';

const ChatApp = () => {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginPage, setShowLoginPage] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setAuthUser(user);
      setAuthLoading(false);

      if (user) {
        setShowLoginPage(false);
      }
    });

    return unsubscribe;
  }, []);

  if (authLoading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-text">Loading KrishnaGPT...</div>
      </div>
    );
  }

  if (!authUser && showLoginPage) {
    return <LoginPage onBackToGuest={() => setShowLoginPage(false)} />;
  }

  return <ChatPage user={authUser} onOpenLogin={() => setShowLoginPage(true)} />;
};

export default ChatApp;
