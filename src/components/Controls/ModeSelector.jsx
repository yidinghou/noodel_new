import React from 'react';

/**
 * Mode selector modal - allows user to choose between Classic and Clear modes
 * @param {boolean} visible - Whether the modal should be visible
 * @param {function} onSelectMode - Callback when a mode is selected (receives 'classic' or 'clear')
 */
function ModeSelector({ visible, onSelectMode }) {
  const handleModeSelect = (mode) => {
    onSelectMode(mode);
  };

  return (
    <div className={`mode-selection-menu ${visible ? 'visible' : ''}`}>
      <div className="mode-selection-content">
        <h2 className="mode-selection-title">Select Game Mode</h2>
        <div className="mode-selection-buttons">
          <button
            className="mode-selection-btn classic-btn"
            onClick={() => handleModeSelect('classic')}
          >
            Classic
          </button>
          <button
            className="mode-selection-btn clear-btn"
            onClick={() => handleModeSelect('clear')}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModeSelector;
