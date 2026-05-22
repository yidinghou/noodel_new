const ICON_PROPS = {
  width: 18, height: 18, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true,
};

function HowToPlayIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

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
