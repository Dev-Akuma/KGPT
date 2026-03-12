const PANEL_CONTENT = {
  settings: {
    title: 'Settings',
    description: 'Manage app preferences and account controls.',
  },
  help: {
    title: 'Help',
    description: 'Help resources and quick troubleshooting guides are coming soon.',
  },
  upgrade: {
    title: 'Upgrade Plan',
    description: 'Premium plan options will be available here soon. This is a placeholder for now.',
  },
};

const UtilityPanel = ({
  panelKey,
  onClose,
  onDeleteAccount,
  deletingAccount = false,
  deleteAccountError = '',
}) => {
  const panel = PANEL_CONTENT[panelKey] || {
    title: 'Coming Soon',
    description: 'This section is under construction.',
  };

  const isSettingsPanel = panelKey === 'settings';

  return (
    <div className="profile-panel-overlay" role="presentation" onClick={onClose}>
      <aside
        className="profile-panel"
        role="dialog"
        aria-modal="true"
        aria-label={panel.title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-panel-header">
          <h2>{panel.title}</h2>
          <button type="button" className="profile-panel-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="profile-section">
          <h3>{isSettingsPanel ? 'General' : 'Coming soon'}</h3>
          <p className="profile-empty">{panel.description}</p>
        </div>

        {isSettingsPanel ? (
          <div className="profile-section utility-danger-section">
            <h3>Danger Zone</h3>
            <p className="profile-empty">
              Delete your account and permanently remove your chats, memory profile, and user record
              from Firestore.
            </p>

            {deleteAccountError ? (
              <p className="utility-error-text" role="alert">
                {deleteAccountError}
              </p>
            ) : null}

            <button
              type="button"
              className="profile-delete-btn"
              onClick={onDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount ? 'Deleting account...' : 'Delete account'}
            </button>
          </div>
        ) : null}
      </aside>
    </div>
  );
};

export default UtilityPanel;
