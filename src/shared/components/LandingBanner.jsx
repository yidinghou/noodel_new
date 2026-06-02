import { useCurrentUser } from '../hooks/useCurrentUser.js';
import { peekDailyInProgress } from '../../services/sessionStorage.js';
import './LandingBanner.css';

function LandingBanner({ onLogin }) {
  const currentUser = useCurrentUser();
  const hasDailyResume = currentUser ? peekDailyInProgress() : false;

  if (!currentUser) {
    return (
      <div className="landing-banner landing-banner--guest">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M10 10a4 4 0 100-8 4 4 0 000 8z"/>
          <path d="M2 18a8 8 0 0116 0"/>
        </svg>
        Playing as guest — scores won't be saved.{' '}
        <button type="button" className="landing-banner__link" onClick={onLogin}>Log in</button>
        {' '}or{' '}
        <button type="button" className="landing-banner__link" onClick={onLogin}>Create account</button>
      </div>
    );
  }

  if (hasDailyResume) {
    return (
      <div className="landing-banner landing-banner--resume">
        <span aria-hidden="true">⏸</span>
        <strong>{currentUser}</strong>, you have a daily puzzle in progress.
      </div>
    );
  }

  return (
    <div className="landing-banner landing-banner--loggedin">
      <span aria-hidden="true">👋</span>
      Welcome back, <strong>{currentUser}</strong> — ready for today's puzzle?
    </div>
  );
}

export default LandingBanner;
