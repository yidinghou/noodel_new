import ActionBar from './ActionBar.jsx';
import NextRow from './NextRow.jsx';
import MadeWords from '../../classic/components/Stats/MadeWords.jsx';
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

function Shell({ score, lettersLeft, next, madeWords, dictionary, nextUpRef, onHowToPlay, onLogin, onSettings, children }) {
  const { undo } = useGame();
  const leftActions = [{ id: 'howtoplay', onClick: onHowToPlay }];
  const rightActions = [
    { id: 'login', onClick: onLogin },
    { id: 'settings', onClick: onSettings },
  ];

  return (
    <div className="rd-shell">
      <header className="app-bar">
        <div className="app-bar__side app-bar__side--left">
          <ActionBar items={leftActions} />
        </div>
        <div aria-hidden="true" />
        <div className="app-bar__side app-bar__side--right">
          <ActionBar items={rightActions} />
        </div>
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
      </div>

      <NextRow letters={next} lettersLeft={lettersLeft} firstTileRef={nextUpRef} />

      {children}

      <MadeWords words={madeWords ?? []} dictionary={dictionary} visible={true} />
    </div>
  );
}

export default Shell;
