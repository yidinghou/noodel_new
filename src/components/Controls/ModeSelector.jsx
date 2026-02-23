import React from 'react';

/**
 * Start menu - allows user to choose between game modes and tutorial
 * @param {boolean} visible - Whether the menu should be visible
 * @param {function} onSelectMode - Callback when a mode is selected (receives 'classic', 'clear', or 'tutorial')
 */
function ModeSelector({ visible, onSelectMode }) {
  const handleModeSelect = (mode) => {
    onSelectMode(mode);
  };

  return (
    <div className={`mode-selection-menu ${visible ? 'visible' : ''}`}>
      <div className="mode-selection-content">
        <h2 className="mode-selection-title">Start Menu</h2>

        <div className="mode-selection-section">
          <h3 className="mode-selection-section-title">Play Game</h3>
          <div className="mode-selection-buttons">
            <button
              className="mode-selection-btn classic-btn"
              onClick={() => handleModeSelect('classic')}
            >
              <span className="btn-title">Classic <span className="btn-emoji">🕹️</span></span>
              <span className="btn-description">Score big with 100 letters.</span>
            </button>
            <button
              className="mode-selection-btn clear-btn"
              onClick={() => handleModeSelect('clear')}
            >
              <span className="btn-title">Clear <span className="btn-emoji">🧹</span></span>
              <span className="btn-description">Wipe the board of all tiles.</span>
            </button>
          </div>
        </div>

        <div className="mode-selection-section">
          <h3 className="mode-selection-section-title">Learn</h3>
          <div className="mode-selection-buttons">
            <button
              className="mode-selection-btn tutorial-btn"
              onClick={() => handleModeSelect('tutorial')}
            >
              Tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModeSelector;
