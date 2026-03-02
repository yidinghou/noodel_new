import React from 'react';

/**
 * Start menu - allows user to choose between game modes and tutorial
 * @param {boolean} visible - Whether the menu should be visible
 * @param {function} onSelectMode - Callback when a mode is selected (receives 'classic', 'clear', or 'tutorial')
 * @param {function} onClose - Callback when close button is clicked
 * @param {string|null} pendingMode - Mode being queued (while dictionary loads)
 * @param {boolean} dictLoading - Whether dictionary is still loading
 * @param {boolean} dictReady - Whether dictionary has finished loading
 */
function ModeSelector({ visible, onSelectMode, onClose, pendingMode, dictLoading, dictReady }) {
  const handleModeSelect = (mode) => {
    onSelectMode(mode);
  };

  const isButtonPending = (mode) => pendingMode === mode;
  const isButtonDisabled = (mode) => pendingMode !== null && pendingMode !== mode;
  const isButtonReady = (mode) => pendingMode === mode && dictReady;

  return (
    <div className={`mode-selection-menu ${visible ? 'visible' : ''}`}>
      <div className="mode-selection-content">
        <button
          className="mode-selection-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          ✕
        </button>
        <h2 className="mode-selection-title">Start Menu</h2>

        <div className="mode-selection-section">
          <h3 className="mode-selection-section-title">Play Game</h3>
          <div className="mode-selection-buttons">
            <button
              className={`mode-selection-btn classic-btn ${isButtonReady('classic') ? 'ready' : ''}`}
              onClick={() => handleModeSelect('classic')}
              disabled={isButtonDisabled('classic')}
            >
              <span className="btn-title">
                {isButtonPending('classic') ? (dictReady ? 'Click to start' : 'Loading...') : 'Classic'}
                {!isButtonPending('classic') && <span className="btn-emoji">🕹️</span>}
              </span>
              {!isButtonPending('classic') && <span className="btn-description">Score big with 100 letters.</span>}
            </button>
            <button
              className={`mode-selection-btn clear-btn ${isButtonReady('clear') ? 'ready' : ''}`}
              onClick={() => handleModeSelect('clear')}
              disabled={isButtonDisabled('clear')}
            >
              <span className="btn-title">
                {isButtonPending('clear') ? (dictReady ? 'Click to start' : 'Loading...') : 'Clear'}
                {!isButtonPending('clear') && <span className="btn-emoji">🧹</span>}
              </span>
              {!isButtonPending('clear') && <span className="btn-description">Wipe the board of all tiles.</span>}
            </button>
          </div>
        </div>

        <div className="mode-selection-section">
          <h3 className="mode-selection-section-title">Learn</h3>
          <div className="mode-selection-buttons">
            <button
              className={`mode-selection-btn tutorial-btn ${isButtonReady('tutorial') ? 'ready' : ''}`}
              onClick={() => handleModeSelect('tutorial')}
              disabled={isButtonDisabled('tutorial')}
            >
              {isButtonPending('tutorial') ? (dictReady ? 'Click to start' : 'Loading...') : 'Tutorial'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModeSelector;
