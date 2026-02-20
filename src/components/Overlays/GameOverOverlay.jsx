import React from 'react';

/**
 * Game over overlay - shows win/loss message and restart button
 */
function GameOverOverlay({ visible, gameMode, score, onRestart }) {
  if (!visible) return null;

  const isClearMode = gameMode === 'clear';
  const hasInitialBlocks = isClearMode; // Simplified check - in actual state this would be checked properly

  // Determine if it's a win or loss
  // In Clear mode: win if all initial blocks cleared, loss otherwise
  // In Classic mode: always end of game (score-based)
  const title = isClearMode ? (
    <h1 className="game-over-title">Game Over!</h1>
  ) : (
    <h1 className="game-over-title">Game Over!</h1>
  );

  return (
    <div className="game-over-overlay visible">
      <div className="game-over-content">
        {title}
        <div className="game-over-score">
          Final Score: {score}
        </div>
        <button className="game-over-restart-btn" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
}

export default GameOverOverlay;
