import ActionBar from './ActionBar.jsx';
import NextRow from './NextRow.jsx';
import { useGame } from '../../../context/GameContext.jsx';

const WORDMARK_LETTERS = ['N', 'O', 'O', 'D', 'E', 'L'];
const UNDO_LETTER_INDEX = 2;

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

function Shell({ score, lettersLeft, next, madeWords, nextUpRef, onHowToPlay, onLogin, onSettings, children }) {
  const { undo } = useGame();
  const leftActions = [{ id: 'howtoplay', onClick: onHowToPlay }];
  const rightActions = [
    { id: 'login', onClick: onLogin },
    { id: 'settings', onClick: onSettings },
  ];

  const wordList = (madeWords ?? []).map((entry) =>
    typeof entry === 'string' ? entry : entry.word
  );

  return (
    <div className="rd-shell">
      <header className="rd-app-bar">
        <ActionBar items={leftActions} className="rd-action-bar--left" />
        <div aria-hidden="true" />
        <ActionBar items={rightActions} className="rd-action-bar--right" />
      </header>

      <div className="rd-hero">
        <div className="rd-wordmark">
          <span className="rd-wordmark__text">
            {WORDMARK_LETTERS.map((letter, i) => (
              <span
                key={i}
                className={`rd-wordmark__letter${i === UNDO_LETTER_INDEX ? ' rd-wordmark__undo' : ''}`}
                onClick={i === UNDO_LETTER_INDEX ? (e) => handleUndoClick(undo, e) : undefined}
                title={i === UNDO_LETTER_INDEX ? 'Click to undo (hidden feature)' : undefined}
              >
                {letter}
              </span>
            ))}
          </span>
          <span className="rd-wordmark__rule" aria-hidden="true" />
        </div>
        <div className="rd-hero-score">
          <span className="rd-hero-score__label">Score</span>
          <span className="rd-hero-score__value">{score}</span>
        </div>
      </div>

      <NextRow letters={next} lettersLeft={lettersLeft} firstTileRef={nextUpRef} />

      {children}

      <section className="rd-made-words">
        <div className="rd-made-words__label">Words made</div>
        <div className="rd-made-words__list">
          {wordList.map((w, i) => (
            <span key={`${w}-${i}`} className="rd-chip">{w}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Shell;
