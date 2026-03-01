import React from 'react';

function Actions({ onStart, onMute, isMuted = false, visible = true }) {
  return (
    <div className={`controls ${visible ? 'visible' : ''}`}>
      <button className="start-btn" onClick={onStart} title="Play">
        ▶
      </button>
      <button className="settings-btn" onClick={onMute} title="Settings">
        ⚙
      </button>
    </div>
  );
}

export default Actions;
