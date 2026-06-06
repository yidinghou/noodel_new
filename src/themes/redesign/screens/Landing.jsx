import { useGame } from '../../../context/GameContext.jsx';
import ActionBar from '../components/ActionBar.jsx';
import { useAmbientDemo, AmbientBoard } from '../components/AmbientDemo.jsx';
import GameModePanel from '../../../shared/components/GameModePanel.jsx';
import LandingBanner from '../../../shared/components/LandingBanner.jsx';
import { useStreaks } from '../../../hooks/useStreaks.js';

const WORDMARK_LETTERS = ['N', 'O', 'O', 'D', 'E', 'L'];

function Landing({ onHowToPlay, onLogin, onSettings }) {
  const { dispatch, resumeSession } = useGame();
  const demo = useAmbientDemo();
  const username = localStorage.getItem('noodel_username') ?? null;
  const { loginStreak, clearStreak } = useStreaks(username);

  const leftActions = [{ id: 'howtoplay', onClick: onHowToPlay }];
  const rightActions = [
    { id: 'login', onClick: onLogin },
    { id: 'settings', onClick: onSettings },
  ];

  return (
    <div className="rd-screen rd-landing">
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
          <span className="rd-wordmark__tiles">
            {WORDMARK_LETTERS.map((letter, i) => (
              <span
                key={i}
                className={`rd-wordmark__tile${i < Math.min(loginStreak, 6) ? ' rd-wordmark__tile--lit' : ''}`}
              >
                {letter}
              </span>
            ))}
          </span>
          {clearStreak > 0 && (
            <span className="rd-wordmark__clear-streak">
              🔥 <strong>{clearStreak}</strong> day clear streak
            </span>
          )}
        </div>
        <p className="rd-tagline">A word-dropping puzzle</p>
      </div>

      <LandingBanner onLogin={onLogin} clearStreak={clearStreak} loginStreak={loginStreak} />

      <section className="rd-landing__stage">
        <div className="rd-board-stage">
          <AmbientBoard {...demo} />
          <GameModePanel dispatch={dispatch} resumeSession={resumeSession} className="start-game-overlay--redesign" />
        </div>
      </section>
    </div>
  );
}

export default Landing;
