import { useState, useEffect, useRef } from 'react';
import { useSettingsState } from '../hooks/useSettingsState.js';
import { NOODEL_LOGIN_EVENT } from '../hooks/useCurrentUser.js';
import { useGame } from '../../context/GameContext.jsx';
import { A } from '../../utils/actionTypes.js';
import { STATUS } from '../../utils/gameConstants.js';
import './SettingsMenu.css';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

function LoginMenu({ onClose }) {
  const s = useSettingsState({ onClose });
  const { dispatch, state } = useGame();
  const isGameActive = state.status !== STATUS.IDLE;
  // view: 'landing' | 'login' | 'create'
  const [view, setView] = useState('landing');

  const handleLogout = () => {
    s.logout();
    dispatch({ type: A.RESET });
    window.dispatchEvent(new CustomEvent(NOODEL_LOGIN_EVENT));
    onClose?.();
  };

  const finish = (username) => {
    s.selectUser(username);
    if (isGameActive) dispatch({ type: A.RESET });
    window.dispatchEvent(new CustomEvent(NOODEL_LOGIN_EVENT));
    onClose?.();
  };

  return (
    <div className="settings-menu" onClick={onClose}>
      <div className="settings-menu__card" onClick={e => e.stopPropagation()}>
        <button type="button" className="settings-menu__close" onClick={onClose} aria-label="Close">✕</button>

        {isGameActive && (
          <p className="login-status login-status--warn">
            ⚠ Logging in or out during a game returns you to the home screen
          </p>
        )}

        {s.currentUser ? (
          <LoggedInView currentUser={s.currentUser} onLogout={handleLogout} />
        ) : view === 'landing' ? (
          <LandingView onLogin={() => setView('login')} onCreate={() => setView('create')} />
        ) : view === 'login' ? (
          <LoginView onBack={() => setView('landing')} onSuccess={finish} />
        ) : (
          <CreateView onBack={() => setView('landing')} onSuccess={finish} />
        )}
      </div>
    </div>
  );
}

function LoggedInView({ currentUser, onLogout }) {
  return (
    <>
      <h2 className="settings-menu__title">Logged in</h2>
      <div className="settings-menu__list">
        <div className="settings-menu__btn is-active" style={{ cursor: 'default' }}>
          <span>✓ {currentUser}</span>
        </div>
        <button className="settings-menu__btn settings-menu__btn--logout" onClick={onLogout}>
          Log out
        </button>
      </div>
    </>
  );
}

function LandingView({ onLogin, onCreate }) {
  return (
    <>
      <h2 className="settings-menu__title">Welcome</h2>
      <div className="settings-menu__list">
        <button className="settings-menu__btn login-form__submit login-form__submit--enabled" style={{ justifyContent: 'center' }} onClick={onLogin}>
          Log in
        </button>
        <button className="settings-menu__btn" style={{ justifyContent: 'center' }} onClick={onCreate}>
          Create username
        </button>
      </div>
    </>
  );
}

function LoginView({ onBack, onSuccess }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/users/check?username=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!data.available) {
        onSuccess(trimmed);
      } else {
        setError('No account with that username');
      }
    } catch {
      setError('Could not reach server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="login-header">
        <button type="button" className="login-back" onClick={onBack} aria-label="Back">←</button>
        <h2 className="settings-menu__title" style={{ margin: 0 }}>Log in</h2>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <input
          className="login-form__input"
          type="text"
          placeholder="Enter your username"
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          maxLength={21}
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
        />
        {error && <span className="login-status login-status--err">✗ {error}</span>}
        <button
          className="settings-menu__btn login-form__submit login-form__submit--enabled"
          type="submit"
          disabled={!input.trim() || submitting}
        >
          {submitting ? 'Checking…' : 'Log in'}
        </button>
      </form>
    </>
  );
}

function CreateView({ onBack, onSuccess }) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle'); // idle | checking | available | taken | invalid | error
  const [statusMsg, setStatusMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef(null);

  const check = (value) => {
    clearTimeout(debounceRef.current);
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) { setStatus('idle'); setStatusMsg(''); return; }
    if (trimmed.length > 20) { setStatus('invalid'); setStatusMsg('Max 20 characters'); return; }
    if (!USERNAME_REGEX.test(trimmed)) { setStatus('invalid'); setStatusMsg('Only letters, numbers, and underscores'); return; }
    setStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/check?username=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (data.available) { setStatus('available'); setStatusMsg('Available'); }
        else { setStatus('taken'); setStatusMsg('Already taken'); }
      } catch {
        setStatus('error'); setStatusMsg('Could not reach server');
      }
    }, 400);
  };

  const handleChange = (e) => { setInput(e.target.value); check(e.target.value); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status !== 'available' || submitting) return;
    const trimmed = input.trim().toLowerCase();
    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      });
      if (res.status === 409) { setStatus('taken'); setStatusMsg('Already taken'); return; }
      if (!res.ok) { setStatus('error'); setStatusMsg('Something went wrong, try again'); return; }
      const { username } = await res.json();
      onSuccess(username);
    } catch {
      setStatus('error'); setStatusMsg('Something went wrong, try again');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const statusLabel = status === 'idle' ? '' :
    status === 'checking' ? 'Checking…' :
    status === 'available' ? `✓ ${statusMsg}` :
    `✗ ${statusMsg}`;

  const statusClass = { available: 'login-status--ok', checking: 'login-status--checking' }[status] ?? 'login-status--err';

  return (
    <>
      <div className="login-header">
        <button type="button" className="login-back" onClick={onBack} aria-label="Back">←</button>
        <h2 className="settings-menu__title" style={{ margin: 0 }}>Create username</h2>
      </div>
      <p className="login-hint">Letters, numbers, and underscores only · Max 20 characters · Not case-sensitive</p>
      <form className="login-form" onSubmit={handleSubmit}>
        <input
          className="login-form__input"
          type="text"
          placeholder="e.g. coolplayer42"
          value={input}
          onChange={handleChange}
          maxLength={21}
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
        />
        {statusLabel && <span className={`login-status ${statusClass}`}>{statusLabel}</span>}
        <button
          className={`settings-menu__btn login-form__submit${status === 'available' ? ' login-form__submit--enabled' : ''}`}
          type="submit"
          disabled={status !== 'available' || submitting}
        >
          {submitting ? 'Creating…' : 'Create & log in'}
        </button>
      </form>
    </>
  );
}

export default LoginMenu;
