import { useState } from 'react';
import HowToPlayModal from './HowToPlayModal.jsx';

export default function HomeScreen() {
  const [showHTP, setShowHTP] = useState(false);

  return (
    <div style={h.page}>
      <div className="card" style={h.card}>
        <h1 style={h.title}><span style={h.titleN}>N</span>OODLE</h1>
        <p style={h.desc}>a word puzzle game</p>
        <div style={h.btns}>
          <button style={h.btn} title="Play"         onClick={() => alert('Play!')}>&#9654;</button>
          <button style={h.btn} title="Settings"     onClick={() => alert('Settings!')}>&#9881;</button>
          <button style={h.btn} title="How to play"  onClick={() => setShowHTP(true)}>?</button>
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
  title: { fontSize: 'clamp(32px,8vw,56px)', fontFamily: "'Montserrat', sans-serif", fontWeight: 400, letterSpacing: '0.05em', color: 'var(--color-text-primary)', margin: 0 },
  titleN: {
    background: '#4CAF50', color: '#fff',
    borderRadius: 6, padding: '0 0.08em',
    marginRight: '0.02em',
  },
  desc:  { fontSize: 'clamp(13px,2vw,16px)', color: 'var(--color-text-secondary)', margin: 0 },
  btns:  { display: 'flex', flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: {
    width: 'var(--size-letter-block)', height: 'var(--size-letter-block)', aspectRatio: '1/1',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#fff', color: '#333',
    border: '2px solid #333', borderRadius: 8, fontSize: 'clamp(16px,2vw,20px)',
    fontWeight: 'bold', cursor: 'pointer',
  },
};
