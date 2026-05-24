import { useRef } from 'react';
import { useGame } from '../../../context/GameContext.jsx';
import { A } from '../../../utils/actionTypes.js';
import ActionBar from '../components/ActionBar.jsx';
import NextRow from '../components/NextRow.jsx';
import { useAmbientDemo, AmbientBoard } from '../components/AmbientDemo.jsx';
import StartGameOverlay from '../../../shared/components/StartGameOverlay.jsx';

function Landing({ onHowToPlay, onLogin, onSettings }) {
  const { dispatch } = useGame();
  const demo = useAmbientDemo();
  const firstTileRef = useRef(null);

  const leftActions = [{ id: 'howtoplay', onClick: onHowToPlay }];
  const rightActions = [
    { id: 'login', onClick: onLogin },
    { id: 'settings', onClick: onSettings },
  ];

  return (
    <div className="rd-screen rd-landing">
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
        <p className="rd-tagline">A word-dropping puzzle</p>
      </div>

      <section className="rd-landing__stage">
        <NextRow letters={demo.queue} firstTileRef={firstTileRef} />
        <div className="rd-board-stage">
          <AmbientBoard {...demo} firstTileRef={firstTileRef} />
          <StartGameOverlay
            className="start-game-overlay--redesign"
            onClick={() => dispatch({ type: A.START_GAME, payload: { mode: 'clear' } })}
          />
        </div>
      </section>
    </div>
  );
}

export default Landing;
