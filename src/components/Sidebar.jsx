const Sidebar = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
}) => {
  return (
    <aside id="kgpt-sidebar" className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">KrishnaGPT 🪔</div>
        <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
          ×
        </button>
      </div>

      <button className="new-chat-btn" type="button">
        + New Chat
      </button>

      <div className="history-list" role="list" aria-label="Chat history">
        {conversations.map((conversation) => (
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
        ))}
      </div>

      <div className="profile-card">
        <div className="avatar-placeholder">K</div>
        <div>
          <div className="profile-name">Guest User</div>
          <div className="profile-subtitle">Sign in to sync chats</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
