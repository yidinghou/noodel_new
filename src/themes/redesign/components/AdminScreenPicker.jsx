const SCREENS = [
  { id: 'landing',  label: 'Landing' },
  { id: 'ingame',   label: 'In Game' },
  { id: 'gameover', label: 'Game Over' },
];

export default function AdminScreenPicker({ current, onSelect }) {
  return (
    <div className="screen-picker">
      {SCREENS.map(s => (
        <button
          key={s.id}
          type="button"
          className={`screen-picker__btn${current === s.id ? ' is-active' : ''}`}
          onClick={() => onSelect(s.id)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
