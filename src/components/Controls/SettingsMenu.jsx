import React from 'react';

/**
 * Settings menu - allows user to configure game and account settings
 * @param {boolean} visible - Whether the menu should be visible
 * @param {function} onClose - Callback when close button is clicked
 * @param {boolean} isMuted - Whether sound is muted
 * @param {function} onToggleMute - Callback to toggle mute state
 */
function SettingsMenu({ visible, onClose, isMuted, onToggleMute, hasGameSession, onReplay }) {
  const isOnPoc = window.location.pathname.includes('poc.html');
  const switchTarget = isOnPoc ? '/noodel_new/' : '/noodel_new/poc.html';
  const switchLabel = isOnPoc ? 'Switch to Classic' : 'Switch to New UI';

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
            {hasGameSession && (
              <button className="mode-selection-btn settings-btn-item" onClick={onReplay}>
                🎬 Replay Game
              </button>
            )}
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
            <button
              className="mode-selection-btn settings-btn-item"
              onClick={() => { window.location.href = switchTarget; }}
            >
              {isOnPoc ? '🎮 Switch to Classic' : '✨ Switch to New UI'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsMenu;
