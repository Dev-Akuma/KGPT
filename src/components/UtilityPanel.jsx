const PANEL_CONTENT = {
  settings: {
    title: 'Settings',
    description: 'Preference controls are coming soon. You will be able to manage app behavior and defaults here.',
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

const UtilityPanel = ({ panelKey, onClose }) => {
  const panel = PANEL_CONTENT[panelKey] || {
    title: 'Coming Soon',
    description: 'This section is under construction.',
  };

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
          <h3>Coming soon</h3>
          <p className="profile-empty">{panel.description}</p>
        </div>
      </aside>
    </div>
  );
};

export default UtilityPanel;
