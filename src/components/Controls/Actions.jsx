import React from 'react';

function Actions({ onStart, onMute, isMuted = false }) {
  return (
    <div className="controls">
      <button className="start-btn" onClick={onStart} title="Open menu">
        ☰
      </button>
      <button className="mute-btn" onClick={onMute}>
        {isMuted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}

export default Actions;
