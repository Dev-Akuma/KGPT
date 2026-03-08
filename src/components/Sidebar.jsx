import { memo, useEffect, useMemo, useRef, useState } from 'react';

const Sidebar = ({
  isOpen,
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
  onOpenUpgrade,
  onOpenHelp,
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
    <aside id="kgpt-sidebar" className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">KrishnaGPT</div>
        <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
          ×
        </button>
      </div>

      <button className="new-chat-btn" type="button" onClick={onNewChat}>
        + New Chat
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

        {isAuthenticated && isMenuOpen ? (
          <div className="profile-dropdown" role="menu" aria-label="Profile menu">
            <button type="button" role="menuitem" onClick={() => runMenuAction(onOpenSettings)}>
              Settings
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => runMenuAction(onOpenPersonalization)}
            >
              Personalization
            </button>
            <button type="button" role="menuitem" onClick={() => runMenuAction(onOpenUpgrade)}>
              Upgrade Plan
            </button>
            <button type="button" role="menuitem" onClick={() => runMenuAction(onOpenHelp)}>
              Help
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
