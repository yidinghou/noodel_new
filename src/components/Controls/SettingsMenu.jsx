import React from 'react';

/**
 * Settings menu - allows user to configure game and account settings
 * @param {boolean} visible - Whether the menu should be visible
 * @param {function} onClose - Callback when close button is clicked
 * @param {boolean} isMuted - Whether sound is muted
 * @param {function} onToggleMute - Callback to toggle mute state
 */
function SettingsMenu({ visible, onClose, isMuted, onToggleMute }) {
  return (
    <div className={`mode-selection-menu settings-variant ${visible ? 'visible' : ''}`}>
      <div className="mode-selection-content">
        <button
          className="mode-selection-close"
          onClick={onClose}
          aria-label="Close settings"
        >
          ✕
        </button>
        <h2 className="mode-selection-title">Settings</h2>

        <div className="mode-selection-section">
          <div className="mode-selection-buttons">
            <button className="mode-selection-btn settings-btn-item">
              👤 Login
            </button>
            <button className="mode-selection-btn settings-btn-item">
              📊 Stats
            </button>
            <button className="mode-selection-btn settings-btn-item">
              🏆 Leaderboard
            </button>
            <button
              className="mode-selection-btn settings-btn-item"
              onClick={onToggleMute}
            >
              {isMuted ? '🔇 Unmute' : '🔊 Sound'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsMenu;
