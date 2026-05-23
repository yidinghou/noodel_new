import { useGame } from '../../../context/GameContext.jsx';
import { A } from '../../../utils/actionTypes.js';
import { TOTAL_LETTERS } from '../../../utils/gameConstants.js';

function WordStatsBullets({ wordStats, intro }) {
  if (!wordStats) return <div className="rd-word-stats-loading">Loading stats…</div>;
  const { longestWord, newWords = [], vocabularySize } = wordStats;
  const hasContent = longestWord || newWords.length > 0;
  if (!hasContent) return null;
  return (
    <div className="rd-word-stats">
      {intro && <p className="rd-word-stats__intro">{intro}</p>}
      <ul className="rd-word-stats__bullets">
        {longestWord && (
          <li>🏆 Longest word: <strong>{longestWord}</strong></li>
        )}
        {newWords.length > 0 && (
          <li>✨ New words: <strong>{newWords.slice(0, 3).join(', ')}</strong></li>
        )}
        {newWords.length > 0 && (
          <li>💹 <span className="rd-word-stats__gain">+{newWords.length}</span>: you added {newWords.length} new {newWords.length === 1 ? 'word' : 'words'} and expanded your vocab to {vocabularySize}!</li>
        )}
      </ul>
    </div>
  );
}

function GameOver() {
  const { state, dispatch } = useGame();

  const isClearMode = state.gameMode === 'clear';
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

  const stats = [
    { label: 'Score',      value: state.score },
    { label: 'Words made', value: state.madeWords.length },
  ];

  const onHome = () => dispatch({ type: A.RESET });
  const onRestart = () => dispatch({ type: A.START_GAME, payload: { mode: state.gameMode } });

  return (
    <div className="rd-screen rd-gameover">
      <div className="rd-gameover__card">
        <h1 className="rd-gameover__title">{title}</h1>
        {message
          ? <p className="rd-gameover__intro">{message}</p>
          : <p className="rd-gameover__intro">Here's how it went.</p>
        }

        <dl className="rd-stat-grid">
          {stats.map((s) => (
            <div key={s.label} className="rd-stat-grid__row">
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>

        {state.wordStats !== undefined && (
          <WordStatsBullets wordStats={state.wordStats} intro={statsIntro} />
        )}

        <div className="rd-gameover__actions">
          <button type="button" className="rd-cta" onClick={onRestart}>
            Play Again
          </button>
          <button type="button" className="rd-link-btn" onClick={onHome}>
            Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOver;
