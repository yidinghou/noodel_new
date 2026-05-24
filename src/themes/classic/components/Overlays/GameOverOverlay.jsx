import React, { useState, useEffect, useMemo } from 'react';
import WordListModal from '../../../../shared/overlays/WordListModal.jsx';
import { formatDailyDate } from '../../../../utils/seededRandom.js';

function GameStatsBullets({ wordStats, intro }) {
  if (!wordStats) return <div className="word-stats-loading">Loading stats…</div>;
  const { longestWord, newWords = [], vocabularySize } = wordStats;
  const hasContent = longestWord || newWords.length > 0;
  if (!hasContent) return null;
  return (
    <>
      {intro && <div className="game-stats-intro">{intro}</div>}
      <ul className="clear-win-bullets">
        {longestWord && (
          <li>🏆 Longest word: <strong>{longestWord}</strong></li>
        )}
        {newWords.length > 0 && (
          <li>✨ New words: <strong>{newWords.slice(0, 3).join(', ')}</strong></li>
        )}
        {newWords.length > 0 && (
          <li>💹 <span style={{ color: '#2e7d32' }}>+{newWords.length}</span>: you added {newWords.length} new {newWords.length === 1 ? 'word' : 'words'} and expanded your vocab to {vocabularySize}!</li>
        )}
      </ul>
    </>
  );
}

function GameOverOverlay({ visible, gameMode, score, lettersRemaining = 0, boardCleared = false, tilesOnBoard = 0, wordStats, allWordsThisGame = [], onRestart }) {
  const [showWordList, setShowWordList] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const newWordsSet = useMemo(() => new Set(wordStats?.newWords ?? []), [wordStats]);

  const isClearMode = gameMode === 'clear';

  useEffect(() => {
    if (isClearMode && wordStats !== undefined) {
      setLoadingLeaderboard(true);
      const username = localStorage.getItem('noodel_username') ?? '';
      fetch(`/api/scores?username=${encodeURIComponent(username)}&gameMode=clear`)
        .then(r => r.json())
        .then(data => setLeaderboard(data))
        .catch(() => setLeaderboard([]))
        .finally(() => setLoadingLeaderboard(false));
    }
  }, [isClearMode, wordStats]);

  if (!visible) return null;

  const finalScore = isClearMode ? (100 - lettersRemaining) : score;
  const lettersUsed = 100 - lettersRemaining;

  let title, message, statsIntro;
  if (isClearMode && boardCleared) {
    title = 'Congrats!';
    message = `You've cleared the board in ${lettersUsed} letters.`;
    statsIntro = "Not only did you clear, you've:";
  } else if (isClearMode && !boardCleared && tilesOnBoard < 8) {
    title = 'So Close!';
    message = 'Better luck tomorrow!';
    statsIntro = "Along the way, you've:";
  } else if (isClearMode && !boardCleared) {
    title = 'Game Over!';
    message = `You were ${lettersRemaining} letters away from clearing the board.`;
    statsIntro = "While you didn't clear many letters, you've:";
  } else {
    title = 'Game Over!';
    message = null;
    statsIntro = "Along the way, you've:";
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
        {wordStats !== undefined && (
          <GameStatsBullets wordStats={wordStats} intro={statsIntro} />
        )}

        {isClearMode && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #ddd' }}>
            <h3 style={{ marginBottom: 8, fontSize: '0.95em', fontWeight: 'bold' }}>Today's Clear Leaderboard</h3>
            {loadingLeaderboard ? (
              <p style={{ color: '#666', fontSize: '0.9em' }}>Loading…</p>
            ) : leaderboard.length === 0 ? (
              <p style={{ color: '#666', fontSize: '0.9em' }}>No scores yet.</p>
            ) : (
              <div style={{ fontSize: '0.85em' }}>
                {leaderboard.map((row, i, arr) => {
                  const isUser = row.username === (localStorage.getItem('noodel_username') ?? '');
                  const prevRank = arr[i - 1]?.rank ?? 0;
                  const showSeparator = row.rank > 5 && prevRank <= 5;
                  return [
                    showSeparator && <div key={`sep-${row.id}`} style={{ textAlign: 'center', color: '#999', margin: '4px 0' }}>···</div>,
                    <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', backgroundColor: isUser ? '#f0f0f0' : 'transparent' }}>
                      <span>#{row.rank} {row.username || 'anonymous'}</span>
                      <span style={{ fontWeight: 'bold' }}>{row.score}</span>
                    </div>
                  ];
                }).flat()}
              </div>
            )}
          </div>
        )}

        {allWordsThisGame.length > 0 && (
          <button
            className="game-over-restart-btn"
            style={{ marginTop: 8, background: 'transparent', color: '#2e7d32', border: '1px solid #2e7d32' }}
            onClick={() => setShowWordList(true)}
          >
            See all {allWordsThisGame.length} words →
          </button>
        )}
        <button className="game-over-restart-btn" onClick={onRestart}>
          Home
        </button>
      </div>
      {showWordList && (
        <WordListModal
          words={allWordsThisGame}
          newWords={newWordsSet}
          onClose={() => setShowWordList(false)}
          title={`Words This Game (${allWordsThisGame.length})`}
        />
      )}
    </div>
  );
}

export default GameOverOverlay;
