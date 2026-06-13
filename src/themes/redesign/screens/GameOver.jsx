import { useState, useEffect, useMemo } from 'react';
import { useGame } from '../../../context/GameContext.jsx';
import { A } from '../../../utils/actionTypes.js';
import { TOTAL_LETTERS } from '../../../utils/gameConstants.js';
import { formatDailyDate, getLocalDateString } from '../../../utils/seededRandom.js';
import WordListModal from '../../../shared/overlays/WordListModal.jsx';

function WordsMadeSection({ words, newWordsSet }) {
  if (!words.length) return null;
  const sorted = [...words].sort((a, b) => a.localeCompare(b));
  return (
    <div className="gameover-words">
      <p className="gameover-words__label">Words made ({words.length})</p>
      <div className="gameover-words__list">
        {sorted.map(w => (
          <span key={w} className={`chip${newWordsSet.has(w) ? ' chip--new' : ''}`}>{w}</span>
        ))}
      </div>
    </div>
  );
}

function GameOver() {
  const { state, dispatch } = useGame();
  const [showWordList, setShowWordList] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const newWordsSet = useMemo(() => new Set(state.wordStats?.newWords ?? []), [state.wordStats]);

  const isClearMode = state.gameMode === 'clear';
  const isDailyGame = state.gameType === 'daily';

  useEffect(() => {
    if (isClearMode && isDailyGame && state.wordStats !== undefined) {
      setLoadingLeaderboard(true);
      const username = localStorage.getItem('noodel_username') ?? '';
      const today = getLocalDateString();
      fetch(`/api/scores?username=${encodeURIComponent(username)}&gameMode=clear&date=${today}`)
        .then(r => r.json())
        .then(data => setLeaderboard(data))
        .catch(() => setLeaderboard([]))
        .finally(() => setLoadingLeaderboard(false));
    }
  }, [isClearMode, isDailyGame, state.wordStats]);
  const lettersRemaining = state.lettersRemaining;
  const lettersUsed = TOTAL_LETTERS - lettersRemaining;
  const boardCleared = isClearMode && state.initialBlocks.length > 0
    ? state.initialBlocks.every(index => !state.grid[index])
    : false;
  const tilesOnBoard = state.grid.filter(Boolean).length;

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

  const wordCount = state.allWordsThisGame.length;
  const vocabSize = state.wordStats?.vocabularySize;

  const stats = [
    { label: 'Score',      value: state.score },
    { label: 'Words made', value: wordCount },
    ...(vocabSize != null ? [{ label: 'Total vocab', value: vocabSize }] : []),
  ];

  const onHome = () => dispatch({ type: A.RESET });
  const onRestart = () => dispatch({ type: A.START_GAME, payload: { mode: state.gameMode, gameType: 'unlimited' } });

  return (
    <div className="screen gameover">
      <div className="gameover__card">
        <h1 className="gameover__title">{title}</h1>
        {message
          ? <p className="gameover__intro">{message}</p>
          : <p className="gameover__intro">Here's how it went.</p>
        }

        <dl className="stat-grid">
          {stats.map((s) => (
            <div key={s.label} className="stat-grid__row">
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>

        {boardCleared && (
          <WordsMadeSection words={state.allWordsThisGame} newWordsSet={newWordsSet} />
        )}

        {isClearMode && isDailyGame && (
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e0e0e0' }}>
            <h3 style={{ marginBottom: 12, fontSize: '0.95em', fontWeight: 500 }}>Today's Clear Leaderboard</h3>
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
                    showSeparator && <div key={`sep-${row.id}`} style={{ textAlign: 'center', color: '#bbb', margin: '6px 0' }}>···</div>,
                    <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', backgroundColor: isUser ? '#f5f5f5' : 'transparent', borderRadius: '4px', paddingLeft: isUser ? '6px' : '0' }}>
                      <span>#{row.rank} <strong>{row.username || 'anonymous'}</strong></span>
                      <span style={{ fontWeight: 600, color: '#2e7d32' }}>{row.score}</span>
                    </div>
                  ];
                }).flat()}
              </div>
            )}
          </div>
        )}

        {isClearMode && !isDailyGame && (
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
            <p style={{ color: '#666', fontSize: '0.9em' }}>
              Play today's <strong>Daily Puzzle</strong> to compete on the leaderboard.
            </p>
          </div>
        )}

        {wordCount > 0 && !boardCleared && (
          <button type="button" className="link-btn" onClick={() => setShowWordList(true)}>
            See all {wordCount} words →
          </button>
        )}

        <div className="gameover__actions">
          <button type="button" className="cta" onClick={onRestart}>
            Play Again
          </button>
          <button type="button" className="link-btn" onClick={onHome}>
            Home
          </button>
        </div>
      </div>

      {showWordList && (
        <WordListModal
          words={state.allWordsThisGame}
          newWords={newWordsSet}
          onClose={() => setShowWordList(false)}
          title={`Words This Game (${wordCount})`}
        />
      )}
    </div>
  );
}

export default GameOver;
