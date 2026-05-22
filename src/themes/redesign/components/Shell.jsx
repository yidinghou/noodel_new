import ActionBar from './ActionBar.jsx';
import NextRow from './NextRow.jsx';

const LEFT_ACTIONS_TEMPLATE = ['howtoplay'];

function Shell({ score, lettersLeft, next, madeWords, nextUpRef, onHowToPlay, onSettings, children }) {
  const leftActions = [{ id: 'howtoplay', onClick: onHowToPlay }];
  const rightActions = [
    { id: 'login' },
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
          <span className="rd-wordmark__text">NOODEL</span>
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
