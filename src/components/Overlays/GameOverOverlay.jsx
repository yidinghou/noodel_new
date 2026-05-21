import React from 'react';

function WordStatsPanel({ wordStats }) {
  if (!wordStats) return <div className="word-stats-loading">Loading stats…</div>;
  const { vocabularySize } = wordStats;
  return (
    <div className="word-stats-panel">
      <div className="word-stat">
        You&apos;ve now made <strong>{vocabularySize}</strong> unique {vocabularySize === 1 ? 'word' : 'words'} total.
      </div>
    </div>
  );
}

function ClearWinStats({ wordStats }) {
  if (!wordStats) return <div className="word-stats-loading">Loading stats…</div>;
  const { longestWord, newWords = [], vocabularySize } = wordStats;
  const hasContent = longestWord || newWords.length > 0;
  if (!hasContent) return null;
  return (
    <ul className="clear-win-bullets">
      {longestWord && (
        <li>🏆 Longest word: <strong>{longestWord}</strong></li>
      )}
      {newWords.length > 0 && (
        <li>✨ New words: <strong>{newWords.slice(0, 3).join(', ')}</strong></li>
      )}
      {newWords.length > 0 && (
        <li>📈 +{newWords.length}: you added {newWords.length} new {newWords.length === 1 ? 'word' : 'words'} and expanded your vocab to {vocabularySize} {vocabularySize === 1 ? 'word' : 'words'}!</li>
      )}
    </ul>
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
        {isClearMode && boardCleared
          ? <ClearWinStats wordStats={wordStats} />
          : wordStats !== undefined && <WordStatsPanel wordStats={wordStats} />}
        <button className="game-over-restart-btn" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
}

export default GameOverOverlay;
