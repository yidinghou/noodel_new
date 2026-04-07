import { useState } from 'react';
import HowToPlayModal from './HowToPlayModal.jsx';

export default function HomeScreen() {
  const [showHTP, setShowHTP] = useState(false);

  return (
    <div style={h.page}>
      <div className="card" style={h.card}>
        <h1 style={h.title}>NOODLE</h1>
        <p style={h.desc}>a word puzzle game</p>
        <div style={h.btns}>
          <button className="start-btn"    title="Play"         onClick={() => alert('Play!')}>&#9654;</button>
          <button className="settings-btn" title="Settings"     onClick={() => alert('Settings!')}>&#9881;</button>
          <button style={h.htpBtn}         title="How to play"  onClick={() => setShowHTP(true)}>?</button>
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
  title: { fontSize: 'clamp(32px,8vw,56px)', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--color-text-primary)', margin: 0 },
  desc:  { fontSize: 'clamp(13px,2vw,16px)', color: 'var(--color-text-secondary)', margin: 0 },
  btns:  { display: 'flex', flexDirection: 'row', gap: 12, marginTop: 8 },
  htpBtn: {
    width: 'var(--size-letter-block)', height: 'var(--size-letter-block)', aspectRatio: '1/1',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(145deg, #a5d6a7, #4CAF50)', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 'clamp(16px,2vw,20px)',
    fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 6px rgba(76,175,80,0.3)',
  },
};
