import { memo } from 'react';

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
  onLoginRequest,
  onOpenProfile,
  onLogout,
}) => {
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
              <button
                key={conversation.id}
                className={`history-item ${
                  conversation.id === activeConversationId ? 'active' : ''
                }`}
                type="button"
                onClick={() => onSelectConversation(conversation.id)}
                title={conversation.title}
              >
                {conversation.title}
              </button>
            ))
          : null}
      </div>

      <div
        className={`profile-card ${isAuthenticated ? 'clickable' : ''}`}
        role={isAuthenticated ? 'button' : undefined}
        tabIndex={isAuthenticated ? 0 : undefined}
        onClick={isAuthenticated ? onOpenProfile : undefined}
        onKeyDown={
          isAuthenticated
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpenProfile();
                }
              }
            : undefined
        }
      >
        <div className="avatar-placeholder">K</div>
        <div>
          <div className="profile-name">{userEmail || 'User'}</div>
          {isAuthenticated ? (
            <button
              className="logout-btn"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onLogout();
              }}
            >
              Log out
            </button>
          ) : (
            <button
              className="login-btn"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onLoginRequest();
              }}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default memo(Sidebar);
