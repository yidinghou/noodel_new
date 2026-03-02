import React from 'react';

/**
 * Game over overlay - shows win/loss message and restart button
 *
 * TODO: Enhance this overlay with:
 * - Distinct win vs loss messaging for Clear mode
 * - Animations on appearance (confetti for wins, etc.)
 * - Stats display (tiles cleared, words found, etc.)
 * - Leaderboard or high score tracking
 * - Share score functionality
 */
function GameOverOverlay({ visible, gameMode, score, lettersRemaining = 0, boardCleared = false, onRestart }) {
  if (!visible) return null;

  const isClearMode = gameMode === 'clear';
  // In clear mode, final score is 100 - letters remaining (letters used)
  const finalScore = isClearMode ? (100 - lettersRemaining) : score;
  const lettersUsed = 100 - lettersRemaining;

  // Generate message based on game mode and result
  let title, message;
  if (isClearMode && boardCleared) {
    title = 'Congrats!';
    message = `You've cleared the board in ${lettersUsed} letters.`;
  } else if (isClearMode && !boardCleared) {
    title = 'Game Over!';
    message = `You were ${lettersRemaining} letters away from clearing the board.`;
  } else {
    title = 'Game Over!';
    message = null;
  }

  return (
    <div className="game-over-overlay visible">
      <div className="game-over-content">
        <h1 className="game-over-title">{title}</h1>
        {message && <div className="game-over-message">{message}</div>}
        {!isClearMode && (
          <div className="game-over-score">
            Final Score: {finalScore}
          </div>
        )}
        <button className="game-over-restart-btn" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
}

export default GameOverOverlay;
