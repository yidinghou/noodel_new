import { useState, useEffect } from 'react';
import { A } from '../../utils/actionTypes.js';
import { formatDailyDate, getLocalDateString } from '../../utils/seededRandom.js';
import { hasDailyBeenPlayed, markDailyPlayed, getUnlimitedRemaining, redeemCode } from '../../utils/playLimits.js';
import { peekDailyInProgress, peekUnlimitedInProgress } from '../../services/sessionStorage.js';
import { useCurrentUser } from '../hooks/useCurrentUser.js';
import './GameModePanel.css';

function GameModePanel({ dispatch, resumeSession, className = '' }) {
  const currentUser = useCurrentUser();
  const [unlimitedLeft, setUnlimitedLeft] = useState(getUnlimitedRemaining);
  const [dailyPlayed, setDailyPlayed] = useState(hasDailyBeenPlayed);
  const [showCode, setShowCode] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeMsg, setCodeMsg] = useState('');

  useEffect(() => {
    setUnlimitedLeft(getUnlimitedRemaining());
  }, [currentUser]);

  useEffect(() => {
    setDailyPlayed(hasDailyBeenPlayed());
    if (!currentUser) return;
    fetch(`/api/daily-status?username=${encodeURIComponent(currentUser)}&date=${getLocalDateString()}`)
      .then(r => r.json())
      .then(data => {
        if (data.played) {
          markDailyPlayed();
          setDailyPlayed(true);
        }
      })
      .catch(() => {});
  }, [currentUser]);

  const hasDailyResume = !dailyPlayed && peekDailyInProgress();
  const hasUnlimitedResume = peekUnlimitedInProgress();
  const unlimitedBlocked = hasDailyResume;

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

  const handleUnlimitedClick = () => {
    if (hasUnlimitedResume) resumeSession?.();
    else startUnlimited();
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
          <button type="button" className="start-game-btn start-game-btn--resume start-game-btn--resume-daily" onClick={handleDailyClick}>
            Continue Daily →
            <span className="start-game-btn__date">{formatDailyDate()}</span>
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

        {hasUnlimitedResume ? (
          <button type="button" className="start-game-btn start-game-btn--resume" onClick={handleUnlimitedClick}>
            Continue Unlimited →
            <span className="start-game-btn__date">Unlimited game in progress</span>
          </button>
        ) : (
          <button type="button" className="start-game-btn" onClick={handleUnlimitedClick} disabled={unlimitedLeft === 0 || unlimitedBlocked}>
            Unlimited Play
            <span className="start-game-btn__date">
              {unlimitedBlocked ? 'Finish your daily first' : playsLabel}
            </span>
          </button>
        )}

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
