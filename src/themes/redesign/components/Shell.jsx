import ActionBar from './ActionBar.jsx';
import NextRow from './NextRow.jsx';
import MadeWordsA from './MadeWordsA.jsx';
import { useGame } from '../../../context/GameContext.jsx';

const WORDMARK_LETTERS = ['N', 'O', 'O', 'D', 'E', 'L'];
const UNDO_LETTER_INDEX = 2;
const STREAK_MAX = WORDMARK_LETTERS.length;

function handleUndoClick(undo, e) {
  e.stopPropagation();
  if (!undo) return;
  const success = undo();
  if (!success) return;
  const target = e.currentTarget;
  target.style.opacity = '0.5';
  setTimeout(() => { target.style.opacity = '1'; }, 100);
}

const LEFT_ACTIONS_TEMPLATE = ['howtoplay'];

function Shell({ score, lettersLeft, next, madeWords, dictionary, nextUpRef, onHowToPlay, onLogin, onSettings, loginStreak, clearStreak, children }) {
  const { undo } = useGame();
  const leftActions = [{ id: 'howtoplay', onClick: onHowToPlay }];
  const rightActions = [
    { id: 'login', onClick: onLogin },
    { id: 'settings', onClick: onSettings },
  ];

  return (
    <div className="shell">
      <header className="app-bar">
        <div className="app-bar__side app-bar__side--left">
          <ActionBar items={leftActions} />
        </div>
        <div aria-hidden="true" />
        <div className="app-bar__side app-bar__side--right">
          <ActionBar items={rightActions} />
        </div>
      </header>

      <div className="hero">
        <div className="wordmark">
          <span className="wordmark__tiles">
            {WORDMARK_LETTERS.map((letter, i) => {
              const lit = i < Math.min(loginStreak ?? 0, STREAK_MAX);
              return (
                <span
                  key={i}
                  className={`wordmark__tile${lit ? ' wordmark__tile--lit' : ''}${i === UNDO_LETTER_INDEX ? ' wordmark__undo' : ''}`}
                  onClick={i === UNDO_LETTER_INDEX ? (e) => handleUndoClick(undo, e) : undefined}
                  title={i === UNDO_LETTER_INDEX ? 'Click to undo (hidden feature)' : undefined}
                >
                  {letter}
                </span>
              );
            })}
          </span>
          {clearStreak > 0 && (
            <span className="wordmark__clear-streak">
              🔥 <strong>{clearStreak}</strong> day clear streak
            </span>
          )}
        </div>
        <p className="tagline">A word-dropping puzzle</p>
      </div>

      <NextRow letters={next} lettersLeft={lettersLeft} firstTileRef={nextUpRef} />

      {children}

      <MadeWordsA words={madeWords ?? []} dictionary={dictionary} />
    </div>
  );
}

export default Shell;
