import React from 'react';

function WordStatsPanel({ wordStats }) {
  if (!wordStats) return <div className="word-stats-loading">Loading stats…</div>;

  const { vocabularySize, rarestWord, worldFirsts } = wordStats;
  const showRarity = rarestWord && rarestWord.timesThisUser <= 3;

  return (
    <div className="word-stats-panel">
      <div className="word-stat">
        You&apos;ve now made <strong>{vocabularySize}</strong> unique {vocabularySize === 1 ? 'word' : 'words'} total.
      </div>
      {showRarity && (
        <div className="word-stat">
          <strong>{rarestWord.word}</strong> — only your {rarestWord.timesThisUser === 1 ? '1st' : rarestWord.timesThisUser === 2 ? '2nd' : '3rd'} time making it!
        </div>
      )}
      {worldFirsts.length > 0 && (
        <div className="word-stat">
          World {worldFirsts.length === 1 ? 'first' : 'firsts'}: <strong>{worldFirsts.join(', ')}</strong> — no one else has ever made {worldFirsts.length === 1 ? 'it' : 'these'}!
        </div>
      )}
    </div>
  );
}

function GameOverOverlay({ visible, gameMode, score, lettersRemaining = 0, boardCleared = false, wordStats, onRestart }) {
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
        {wordStats !== undefined && <WordStatsPanel wordStats={wordStats} />}
        <button className="game-over-restart-btn" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
}

export default GameOverOverlay;
