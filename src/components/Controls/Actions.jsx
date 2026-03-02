import React from 'react';

function Actions({ onStart, onSettings, visible = true }) {
  return (
    <div className={`controls ${visible ? 'visible' : ''}`}>
      <button className="start-btn" onClick={onStart} title="Play">
        ▶
      </button>
      <button className="settings-btn" onClick={onSettings} title="Settings">
        ⚙
      </button>
    </div>
  );
}

export default Actions;
