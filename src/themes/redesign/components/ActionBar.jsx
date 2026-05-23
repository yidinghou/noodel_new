import { HowToPlayIcon, LoginIcon, SettingsIcon } from '../../../shared/icons/ActionIcons.jsx';

const ITEM_DEFS = {
  howtoplay: { label: 'How to Play', Icon: HowToPlayIcon, defaultHandler: () => console.log('how to play') },
  login:     { label: 'Log in',      Icon: LoginIcon,     defaultHandler: () => console.log('log in') },
  settings:  { label: 'Settings',    Icon: SettingsIcon,  defaultHandler: () => console.log('settings') },
};

function ActionBar({ items, className = '' }) {
  return (
    <nav className={`rd-action-bar ${className}`} aria-label="Primary actions">
      {items.map(({ id, onClick }) => {
        const def = ITEM_DEFS[id];
        if (!def) return null;
        const { label, Icon, defaultHandler } = def;
        return (
          <button
            key={id}
            type="button"
            className="rd-action-btn"
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
