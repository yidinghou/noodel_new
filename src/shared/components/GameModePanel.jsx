import { useState } from 'react';
import { A } from '../../utils/actionTypes.js';
import { formatDailyDate } from '../../utils/seededRandom.js';
import { hasDailyBeenPlayed, getUnlimitedRemaining, redeemCode } from '../../utils/playLimits.js';
import { peekDailyInProgress } from '../../services/sessionStorage.js';
import './GameModePanel.css';

function GameModePanel({ dispatch, resumeSession, className = '' }) {
  const [dailyPlayed] = useState(hasDailyBeenPlayed);
  const [hasDailyResume] = useState(() => !hasDailyBeenPlayed() && peekDailyInProgress());
  const [unlimitedLeft, setUnlimitedLeft] = useState(getUnlimitedRemaining);
  const [showCode, setShowCode] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeMsg, setCodeMsg] = useState('');

  const startDaily = () => {
    dispatch({ type: A.START_GAME, payload: { mode: 'clear', gameType: 'daily' } });
  };

  const handleDailyClick = () => {
    if (hasDailyResume) resumeSession?.();
    else startDaily();
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
    <div className={`start-game-overlay${className ? ' ' + className : ''}`}>
      <div className="game-mode-panel__inner">
        {hasDailyResume ? (
          <button type="button" className="start-game-btn start-game-btn--resume" onClick={handleDailyClick}>
            Resume
            <span className="start-game-btn__date">Daily Puzzle in progress</span>
          </button>
        ) : (
          <button type="button" className="start-game-btn" onClick={handleDailyClick} disabled={dailyPlayed}>
            Daily Puzzle
            {dailyPlayed
              ? <span className="start-game-btn__date">Played today ✓</span>
              : <span className="start-game-btn__date">{formatDailyDate()}</span>
            }
          </button>
        )}

        <button
          type="button"
          className="start-game-btn"
          onClick={startUnlimited}
          disabled={unlimitedLeft === 0}
        >
          Unlimited Play
          <span className="start-game-btn__date">{playsLabel}</span>
        </button>

        <div className="game-mode-panel__code">
          <button
            type="button"
            className="game-mode-panel__code-toggle"
            onClick={() => { setShowCode(v => !v); setCodeMsg(''); }}
          >
            Have a code? {showCode ? '▲' : '▼'}
          </button>
          {showCode && (
            <div className="game-mode-panel__code-form">
              <input
                className="game-mode-panel__code-input"
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeMsg(''); }}
                onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                placeholder="Enter code"
              />
              <button type="button" className="game-mode-panel__code-submit" onClick={handleRedeem}>
                Redeem
              </button>
            </div>
          )}
          {codeMsg && (
            <p className={`game-mode-panel__code-msg game-mode-panel__code-msg--${codeMsg.startsWith('+') ? 'ok' : 'err'}`}>
              {codeMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default GameModePanel;
