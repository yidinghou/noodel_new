import { HowToPlayIcon, LoginIcon, LoggedInIcon, SettingsIcon } from '../../../shared/icons/ActionIcons.jsx';
import { useCurrentUser } from '../../../shared/hooks/useCurrentUser.js';

const ITEM_DEFS = {
  howtoplay: { Icon: HowToPlayIcon, extraClass: 'info-btn',     label: 'How to Play' },
  login:     { Icon: LoginIcon,     extraClass: 'login-btn',    label: 'Log in' },
  settings:  { Icon: SettingsIcon,  extraClass: 'settings-btn', label: 'Settings' },
};

function ActionBar({ items }) {
  const currentUser = useCurrentUser();

  return (
    <>
      {items.map(({ id, onClick }) => {
        const def = ITEM_DEFS[id];
        if (!def) return null;
        const isLogin = id === 'login';
        const Icon = isLogin && currentUser ? LoggedInIcon : def.Icon;
        const ariaLabel = isLogin && currentUser ? `Logged in as ${currentUser}` : def.label;

        const btn = (
          <button
            key={id}
            type="button"
            className={`action-btn ${def.extraClass}${isLogin && currentUser ? ' login-btn--loggedin' : ''}`}
            onClick={onClick}
            aria-label={ariaLabel}
            title={ariaLabel}
          >
            <Icon />
          </button>
        );

        if (isLogin) {
          return (
            <div key={id} className="login-wrapper">
              {btn}
              <span
                className="login-wrapper__username"
                aria-hidden={!currentUser}
                style={currentUser ? undefined : { visibility: 'hidden' }}
              >
                {currentUser ?? 'x'}
              </span>
            </div>
          );
        }

        return btn;
      })}
    </>
  );
}

export default ActionBar;
