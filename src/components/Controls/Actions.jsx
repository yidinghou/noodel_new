function Actions({ onStart, onSettings, onInfo, visible = true }) {
  return (
    <div className={`controls ${visible ? 'visible' : ''}`}>
      <button className="start-btn" onClick={onStart} title="Play">
        ▶
      </button>
      <button className="info-btn" onClick={onInfo} title="How to Play">
        ℹ
      </button>
      <button className="settings-btn" onClick={onSettings} title="Settings">
        ⚙
      </button>
    </div>
  );
}

export default Actions;
