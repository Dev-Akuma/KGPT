import { memo, useEffect, useMemo, useRef, useState } from 'react';
import KGPTLogo from './KGPTLogo';

const Sidebar = ({
  isOpen,
  onToggleSidebar,
  onClose,
  conversations,
  chatsLoading,
  activeConversationId,
  isAuthenticated,
  onSelectConversation,
  onNewChat,
  userEmail,
  userName,
  userPhotoUrl,
  onLoginRequest,
  onOpenSettings,
  onOpenPersonalization,
  onDeleteConversation,
  onLogout,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  const avatarInitials = useMemo(() => {
    const source = (userName || userEmail || '').trim();
    if (!source) {
      return 'U';
    }

    if (source.includes('@')) {
      return source.charAt(0).toUpperCase();
    }

    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }, [userEmail, userName]);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const runMenuAction = (action) => {
    closeMenu();
    action();
  };

  return (
    <aside id="kgpt-sidebar" className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-header">
        <button className="sidebar-toggle-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          {isOpen ? (
            <KGPTLogo className="brand-mark brand-mark-sidebar" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
        <div className="sidebar-title">KrishnaGPT</div>
        <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
          ×
        </button>
      </div>

      <button className="new-chat-btn" type="button" onClick={onNewChat} title="New Chat">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="new-chat-icon">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span className="btn-text">New Chat</span>
      </button>

      <div className="history-list" role="list" aria-label="Chat history">
        {!isAuthenticated ? (
          <div className="sidebar-status">
            You are in temporary chat mode. Sign in to save history and switch across sessions.
          </div>
        ) : null}

        {isAuthenticated && chatsLoading ? <div className="sidebar-status">Loading chats...</div> : null}

        {isAuthenticated && !chatsLoading && conversations.length === 0 ? (
          <div className="sidebar-status">No chats yet. Start a new conversation.</div>
        ) : null}

        {isAuthenticated && !chatsLoading
          ? conversations.map((conversation) => (
              <div key={conversation.id} className="history-row">
                <button
                  className={`history-item ${
                    conversation.id === activeConversationId ? 'active' : ''
                  }`}
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  title={conversation.title}
                >
                  {conversation.title}
                </button>

                <button
                  className="history-delete-btn"
                  type="button"
                  aria-label={`Delete conversation ${conversation.title}`}
                  title="Delete conversation"
                  onClick={() => {
                    const shouldDelete = window.confirm('Delete this conversation?');
                    if (shouldDelete) {
                      onDeleteConversation(conversation.id);
                    }
                  }}
                >
                  🗑
                </button>
              </div>
            ))
          : null}
      </div>

      <div className="profile-area" ref={menuRef}>
        <button
          className={`profile-card ${isAuthenticated ? 'clickable' : ''}`}
          type="button"
          onClick={
            isAuthenticated
              ? () => setIsMenuOpen((previous) => !previous)
              : onLoginRequest
          }
          aria-haspopup={isAuthenticated ? 'menu' : undefined}
          aria-expanded={isAuthenticated ? isMenuOpen : undefined}
        >
          {userPhotoUrl ? (
            <img className="avatar-image" src={userPhotoUrl} alt="User profile" />
          ) : (
            <div className="avatar-placeholder">{avatarInitials}</div>
          )}

          <div className="profile-copy">
            <div className="profile-name">{userName || userEmail || 'User'}</div>
            <div className="profile-subtitle">
              {isAuthenticated ? 'Open profile menu' : 'Sign in to sync chats'}
            </div>
          </div>
        </button>

        {isAuthenticated ? (
          <button 
            className="sidebar-settings-btn" 
            type="button" 
            onClick={() => runMenuAction(onOpenSettings)}
            aria-label="Settings"
            title="Settings"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        ) : null}

        {isAuthenticated && isMenuOpen ? (
          <div className="profile-dropdown" role="menu" aria-label="Profile menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => runMenuAction(onOpenPersonalization)}
            >
              Personalization
            </button>
            <button type="button" role="menuitem" onClick={() => runMenuAction(onLogout)}>
              Log Out
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
};

export default memo(Sidebar);
