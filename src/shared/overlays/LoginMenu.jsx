import { useSettingsState, USERS } from '../hooks/useSettingsState.js';
import './SettingsMenu.css';

function LoginMenu({ onClose }) {
  const s = useSettingsState({ onClose });

  const handleSelect = (name) => {
    s.selectUser(name);
    onClose?.();
  };

  return (
    <div className="settings-menu" onClick={onClose}>
      <div className="settings-menu__card" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          className="settings-menu__close"
          onClick={onClose}
          aria-label="Close login"
        >✕</button>
        <h2 className="settings-menu__title">Choose user</h2>

        <div className="settings-menu__list">
          {USERS.map(name => (
            <button
              key={name}
              className={`settings-menu__btn${s.currentUser === name ? ' is-active' : ''}`}
              onClick={() => handleSelect(name)}
            >
              <span>{s.currentUser === name ? '✓ ' : ''}{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LoginMenu;
