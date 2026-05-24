function StartGameOverlay({ onClick, className = '', date }) {
  return (
    <div className={`start-game-overlay${className ? ' ' + className : ''}`}>
      <button type="button" className="start-game-btn" onClick={onClick}>
        Start Game
        {date && <span className="start-game-btn__date">{date}</span>}
      </button>
    </div>
  );
}

export default StartGameOverlay;
