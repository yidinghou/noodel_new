import { HowToPlayIcon, LoginIcon, LoggedInIcon, SettingsIcon } from '../../../shared/icons/ActionIcons.jsx';
import { useCurrentUser } from '../../../shared/hooks/useCurrentUser.js';

const ITEM_DEFS = {
  howtoplay: { label: 'How to Play', Icon: HowToPlayIcon, defaultHandler: () => console.log('how to play') },
  login:     { label: 'Log in',      Icon: LoginIcon,     defaultHandler: () => console.log('log in') },
  settings:  { label: 'Settings',    Icon: SettingsIcon,  defaultHandler: () => console.log('settings') },
};

function ActionBar({ items, className = '' }) {
  const currentUser = useCurrentUser();

  return (
    <nav className={`rd-action-bar ${className}`} aria-label="Primary actions">
      {items.map(({ id, onClick }) => {
        const def = ITEM_DEFS[id];
        if (!def) return null;
        const { defaultHandler } = def;
        const isLogin = id === 'login';
        if (isLogin && currentUser) {
          return (
            <button
              key={id}
              type="button"
              className="rd-avatar-pill"
              onClick={onClick || defaultHandler}
              aria-label={`Logged in as ${currentUser}`}
            >
              <div className="rd-avatar-circle" aria-hidden="true">
                {currentUser[0].toUpperCase()}
              </div>
              <span className="rd-avatar-name">{currentUser}</span>
            </button>
          );
        }
        const Icon = def.Icon;
        const label = def.label;
        return (
          <button
            key={id}
            type="button"
            className={`rd-action-btn${isLogin ? ' rd-action-btn--login' : ''}`}
            onClick={onClick || defaultHandler}
            aria-label={label}
          >
            <Icon />
            <span className="rd-action-btn__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default ActionBar;
