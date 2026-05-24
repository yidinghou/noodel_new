function StartGameOverlay({ onClick, className = '' }) {
  return (
    <div className={`start-game-overlay${className ? ' ' + className : ''}`}>
      <button type="button" className="start-game-btn" onClick={onClick}>
        Start Game
      </button>
    </div>
  );
}

export default StartGameOverlay;
