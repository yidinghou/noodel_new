import { useRef } from 'react';
import { useGame } from '../../../context/GameContext.jsx';
import ActionBar from '../components/ActionBar.jsx';
import NextRow from '../components/NextRow.jsx';
import { useAmbientDemo, AmbientBoard } from '../components/AmbientDemo.jsx';
import GameModePanel from '../../../shared/components/GameModePanel.jsx';
import LandingBanner from '../../../shared/components/LandingBanner.jsx';

function Landing({ onHowToPlay, onLogin, onSettings }) {
  const { dispatch, resumeSession } = useGame();
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

      <LandingBanner onLogin={onLogin} />

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
          <GameModePanel dispatch={dispatch} resumeSession={resumeSession} className="start-game-overlay--redesign" />
        </div>
      </section>
    </div>
  );
}

export default Landing;
