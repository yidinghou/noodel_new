import { useState } from 'react';
import HowToPlayModal from './HowToPlayModal.jsx';

export default function HomeScreen() {
  const [showHTP, setShowHTP] = useState(false);

  return (
    <div style={h.page}>
      <style>{`
        .poc-subtitle-btn:hover { background: rgba(255,255,255,0.18) !important; color: #fff !important; }
        .poc-subtitle-btn:active { background: rgba(255,255,255,0.28) !important; }
      `}</style>
      <div className="card" style={h.card}>
        <div style={h.titleGroup}>
          <h1 style={h.title}><span style={h.titleN}>N</span>OO<span style={h.titleN}>D</span>EL</h1>
          <div style={h.subtitleBar}>
            <span style={h.subtitleText}>a word puzzle game</span>
            <div style={h.subtitleActions}>
              <button className="poc-subtitle-btn" style={h.subtitleBtn} title="Play"        onClick={() => alert('Play!')}>&#9654;</button>
              <button className="poc-subtitle-btn" style={h.subtitleBtn} title="Settings"    onClick={() => alert('Settings!')}>&#9881;</button>
              <button className="poc-subtitle-btn" style={h.subtitleBtn} title="How to play" onClick={() => setShowHTP(true)}>?</button>
            </div>
          </div>
        </div>
      </div>

      {showHTP && <HowToPlayModal onClose={() => setShowHTP(false)} />}
    </div>
  );
}

const h = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%)',
    fontFamily: 'system-ui, sans-serif',
  },
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 16, padding: '32px 40px', minWidth: 260,
  },
  titleGroup: {
    display: 'inline-flex', flexDirection: 'column', gap: 8,
  },
  title: {
    fontSize: 'clamp(32px,8vw,56px)', fontFamily: "'Montserrat', sans-serif",
    fontWeight: 400, letterSpacing: '0.05em', color: 'var(--color-text-primary)', margin: 0,
  },
  titleN: {
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
    padding: '4px 8px', borderRadius: 4,
    fontSize: 'clamp(10px,1.5vw,15px)', fontWeight: 500,
    transition: 'background 0.15s, color 0.15s',
  },
};
