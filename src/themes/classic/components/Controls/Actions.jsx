import { HowToPlayIcon, LoginIcon, SettingsIcon } from '../../../../shared/icons/ActionIcons.jsx';

function Actions({ onLogin, onSettings, onInfo, visible = true }) {
  return (
    <div className={`controls ${visible ? 'visible' : ''}`}>
      <button className="action-btn info-btn" onClick={onInfo} title="How to Play" aria-label="How to Play">
        <HowToPlayIcon />
      </button>
      <button className="action-btn login-btn" onClick={onLogin} title="Log in" aria-label="Log in">
        <LoginIcon />
      </button>
      <button className="action-btn settings-btn" onClick={onSettings} title="Settings" aria-label="Settings">
        <SettingsIcon />
      </button>
    </div>
  );
}

export default Actions;
