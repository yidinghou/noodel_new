import { useRef, useState } from 'react';
import { useGame } from '../../../context/GameContext.jsx';
import { A } from '../../../utils/actionTypes.js';
import { formatDailyDate } from '../../../utils/seededRandom.js';
import { hasDailyBeenPlayed, getUnlimitedRemaining, redeemCode } from '../../../utils/playLimits.js';
import ActionBar from '../components/ActionBar.jsx';
import NextRow from '../components/NextRow.jsx';
import { useAmbientDemo, AmbientBoard } from '../components/AmbientDemo.jsx';

function GameModePanel({ dispatch }) {
  const [dailyPlayed] = useState(hasDailyBeenPlayed);
  const [unlimitedLeft, setUnlimitedLeft] = useState(getUnlimitedRemaining);
  const [showCode, setShowCode] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeMsg, setCodeMsg] = useState('');

  const startDaily = () => {
    dispatch({ type: A.START_GAME, payload: { mode: 'clear', gameType: 'daily' } });
  };

  const startUnlimited = () => {
    if (unlimitedLeft <= 0) return;
    dispatch({ type: A.START_GAME, payload: { mode: 'clear', gameType: 'unlimited' } });
  };

  const handleRedeem = () => {
    const result = redeemCode(codeInput);
    if (result === 'ok') {
      setCodeMsg('+10 plays added!');
      setUnlimitedLeft(getUnlimitedRemaining());
      setCodeInput('');
    } else if (result === 'already_used') {
      setCodeMsg('Already used today.');
    } else {
      setCodeMsg('Invalid code.');
    }
  };

  const playsLabel = unlimitedLeft === 1 ? '1 play left' : `${unlimitedLeft} plays left`;

  return (
    <div className="start-game-overlay start-game-overlay--redesign">
      <div style={{ marginBottom: 12 }}>
        <button
          type="button"
          className="start-game-btn"
          onClick={startDaily}
          disabled={dailyPlayed}
        >
          Daily Puzzle
          {dailyPlayed
            ? <span className="start-game-btn__date">Played today ✓</span>
            : <span className="start-game-btn__date">{formatDailyDate()}</span>
          }
        </button>
      </div>

      <div>
        <button
          type="button"
          className="start-game-btn"
          onClick={startUnlimited}
          disabled={unlimitedLeft === 0}
        >
          Unlimited Play
          <span className="start-game-btn__date">{playsLabel}</span>
        </button>

        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => { setShowCode(v => !v); setCodeMsg(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75em', opacity: 0.6, padding: '2px 0' }}
          >
            Have a code? {showCode ? '▲' : '▼'}
          </button>
          {showCode && (
            <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'center' }}>
              <input
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeMsg(''); }}
                onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                placeholder="Enter code"
                style={{ padding: '4px 8px', fontSize: '0.85em', borderRadius: 4, border: '1px solid #ccc', width: 120, textTransform: 'uppercase' }}
              />
              <button
                type="button"
                onClick={handleRedeem}
                style={{ padding: '4px 10px', fontSize: '0.85em', borderRadius: 4, background: '#2e7d32', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                Redeem
              </button>
            </div>
          )}
          {codeMsg && (
            <p style={{ fontSize: '0.75em', marginTop: 4, color: codeMsg.startsWith('+') ? '#2e7d32' : '#c62828', margin: '4px 0 0' }}>
              {codeMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

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
          <GameModePanel dispatch={dispatch} />
        </div>
      </section>
    </div>
  );
}

export default Landing;
