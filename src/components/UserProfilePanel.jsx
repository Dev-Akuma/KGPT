import { useEffect, useMemo, useState } from 'react';

const SECTION_CONFIG = [
  { key: 'traits', label: 'Personality Traits' },
  { key: 'habits', label: 'Habits' },
  { key: 'concerns', label: 'Concerns' },
  { key: 'goals', label: 'Goals' },
  { key: 'archetypes', label: 'Behavioral Archetypes' },
  { key: 'insights', label: 'Insights' },
];

const UserProfilePanel = ({
  isOpen,
  onClose,
  memory,
  memoryLoading,
  onAddItem,
  onRemoveItem,
  onUpdateCommunicationStyle,
  onToggleMemoryLearning,
  onClearMemory,
}) => {
  const [draftBySection, setDraftBySection] = useState({});
  const [styleDraft, setStyleDraft] = useState(memory?.communication_style || '');

  useEffect(() => {
    setStyleDraft(memory?.communication_style || '');
  }, [memory?.communication_style]);

  const sectionItems = useMemo(() => {
    return SECTION_CONFIG.map((section) => ({
      ...section,
      items: memory?.[section.key] || [],
    }));
  }, [memory]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="profile-panel-overlay" role="presentation" onClick={onClose}>
      <aside
        className="profile-panel"
        role="dialog"
        aria-modal="true"
        aria-label="User memory profile"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-panel-header">
          <h2>Your Memory Profile</h2>
          <button type="button" className="profile-panel-close" onClick={onClose}>
            ×
          </button>
        </div>

        {memoryLoading ? <p className="profile-panel-loading">Loading profile memory...</p> : null}

        {!memoryLoading ? (
          <>
            <label className="memory-toggle-row">
              <input
                type="checkbox"
                checked={memory?.memoryEnabled !== false}
                onChange={(event) => onToggleMemoryLearning(event.target.checked)}
              />
              <span>Enable memory learning</span>
            </label>

            <div className="profile-section">
              <h3>Communication Style</h3>
              <textarea
                value={styleDraft}
                onChange={(event) => setStyleDraft(event.target.value)}
                placeholder="e.g. calm, concise, reflective"
                className="profile-style-input"
              />
              <button
                type="button"
                className="profile-save-btn"
                onClick={() => onUpdateCommunicationStyle(styleDraft)}
              >
                Save style
              </button>
            </div>

            {sectionItems.map((section) => (
              <div key={section.key} className="profile-section">
                <h3>{section.label}</h3>

                {section.items.length === 0 ? (
                  <p className="profile-empty">No entries yet.</p>
                ) : (
                  <div className="profile-chip-list">
                    {section.items.map((item) => (
                      <div key={`${section.key}-${item}`} className="profile-chip">
                        <span>{item}</span>
                        <button type="button" onClick={() => onRemoveItem(section.key, item)}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="profile-add-row">
                  <input
                    value={draftBySection[section.key] || ''}
                    onChange={(event) =>
                      setDraftBySection((prev) => ({
                        ...prev,
                        [section.key]: event.target.value,
                      }))
                    }
                    placeholder={`Add ${section.label.toLowerCase()}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const value = (draftBySection[section.key] || '').trim();
                      if (!value) {
                        return;
                      }

                      onAddItem(section.key, value);
                      setDraftBySection((prev) => ({ ...prev, [section.key]: '' }));
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}

            <button type="button" className="profile-delete-btn" onClick={onClearMemory}>
              Delete all stored memory
            </button>
          </>
        ) : null}
      </aside>
    </div>
  );
};

export default UserProfilePanel;
