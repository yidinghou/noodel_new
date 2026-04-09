const LETTERS = ['N', 'O', 'O', 'D', 'E', 'L'];

function Header({ onUndo, onStart, onSettings, onHowToPlay, visible }) {
  const handleUndoClick = (e) => {
    e.stopPropagation();
    if (onUndo) {
      const success = onUndo();
      if (success) {
        const target = e.currentTarget;
        target.style.opacity = '0.5';
        setTimeout(() => { target.style.opacity = '1'; }, 100);
      }
    }
  };

  return (
    <div style={h.titleGroup}>
      <style>{`
        .header-subtitle-btn:hover { background: #e8e8e8 !important; }
        .header-subtitle-btn:active { background: #d0d0d0 !important; }
      `}</style>
      <h1 style={h.title}>
        {LETTERS.map((letter, index) => {
          const isGreen = index === 0 || index === 3; // N and D
          const isUndo = index === 2; // second O
          return (
            <span
              key={index}
              style={isGreen ? h.titleHighlight : undefined}
              onClick={isUndo ? handleUndoClick : undefined}
              title={isUndo ? 'Click to undo (hidden feature)' : undefined}
            >
              {letter}
            </span>
          );
        })}
      </h1>
      <div style={{ ...h.subtitleBar, ...(visible ? undefined : { opacity: 0, pointerEvents: 'none' }) }}>
        <span style={h.subtitleText}>a word puzzle game</span>
        <div style={h.subtitleActions}>
          <button className="header-subtitle-btn" style={h.subtitleBtn} title="Play"        onClick={onStart}>&#9654;</button>
          <button className="header-subtitle-btn" style={h.subtitleBtn} title="Settings"    onClick={onSettings}>&#9881;</button>
          <button className="header-subtitle-btn" style={h.subtitleBtn} title="How to play" onClick={onHowToPlay}>🛈</button>
        </div>
      </div>
    </div>
  );
}

const h = {
  titleGroup: {
    display: 'flex', flexDirection: 'column', gap: 8, width: '100%',
  },
  title: {
    fontSize: 'clamp(38px,9.6vw,67px)', fontFamily: "'Montserrat', sans-serif",
    fontWeight: 400, letterSpacing: '0.05em', color: 'var(--color-text-primary)', margin: 0,
    textAlign: 'center',
  },
  titleHighlight: {
    background: '#4CAF50', color: '#fff',
    borderRadius: 6, padding: '0 0.08em',
    marginRight: '0.02em',
  },
  subtitleBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#ffffff',
    padding: '5px 10px',
    borderRadius: '0 0 7px 7px',
    marginTop: -2,
    borderTop: '1px solid #000',
    transition: 'opacity 0.3s',
  },
  subtitleText: {
    color: 'rgba(0, 0, 0, 0.9)', fontSize: 'clamp(10px,2vw,14px)',
    fontWeight: 500, letterSpacing: '0.3px',
    flex: 2, whiteSpace: 'nowrap',
  },
  subtitleActions: {
    display: 'flex', gap: 4, flex: 1, justifyContent: 'flex-end',
  },
  subtitleBtn: {
    background: 'transparent', border: 'none',
    color: 'rgba(0, 0, 0, 0.7)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '28px', height: '28px', borderRadius: 4,
    fontSize: 'clamp(10px,1.5vw,15px)', fontWeight: 500,
    transition: 'background 0.15s, color 0.15s',
  },
};

export default Header;
