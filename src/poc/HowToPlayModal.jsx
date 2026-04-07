import { useState } from 'react';
import AnimatedDemo from './AnimatedDemo.jsx';
import { PANEL_TITLES } from './constants.js';

export default function HowToPlayModal({ onClose = () => {} } = {}) {
  const [panelIdx, setPanelIdx] = useState(0);
  const total = PANEL_TITLES.length;

  return (
    <div style={m.backdrop} onClick={onClose}>
      <div style={m.modal} onClick={e => e.stopPropagation()}>

        <div style={m.header}>
          <h2 style={m.title}>How to Play</h2>
          <span style={m.pageNum}>{panelIdx + 1} / {total}</span>
        </div>

        <p style={m.subtitle}>{PANEL_TITLES[panelIdx]}</p>

        <AnimatedDemo key={panelIdx} panelIdx={panelIdx} />

        <div style={m.nav}>
          <button
            style={{ ...m.navBtn, opacity: panelIdx === 0 ? 0.3 : 1 }}
            disabled={panelIdx === 0}
            onClick={() => setPanelIdx(i => i - 1)}
          >&#8249;</button>

          <div style={m.dots}>
            {PANEL_TITLES.map((_, i) => (
              <div
                key={i}
                style={{ ...m.dot, ...(i === panelIdx ? m.dotActive : {}) }}
                onClick={() => setPanelIdx(i)}
              />
            ))}
          </div>

          <button
            style={{ ...m.navBtn, ...(panelIdx === total - 1 ? m.doneBtn : {}) }}
            onClick={() => panelIdx === total - 1 ? onClose() : setPanelIdx(i => i + 1)}
          >
            {panelIdx === total - 1 ? 'Got it' : '\u203A'}
          </button>
        </div>

      </div>
    </div>
  );
}

const m = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    background: '#fff', borderRadius: 16, padding: '24px 24px 20px',
    maxWidth: 300, width: '92%',
    boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  title:   { fontSize: 20, fontWeight: 700, color: '#333', margin: 0 },
  pageNum: { fontSize: 12, color: '#999' },
  subtitle:{ fontSize: 12, fontWeight: 600, color: '#1976D2', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, alignSelf: 'flex-start' },
  nav:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 4 },
  navBtn:  {
    width: 40, height: 40, borderRadius: 8,
    border: '2px solid #e0e0e0', background: '#fff',
    fontSize: 22, cursor: 'pointer', color: '#333',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  },
  doneBtn: { width: 'auto', padding: '0 16px', fontSize: 14, fontWeight: 600, background: '#1976D2', color: '#fff', border: 'none' },
  dots:    { display: 'flex', gap: 6, alignItems: 'center' },
  dot:     { width: 8, height: 8, borderRadius: '50%', background: '#ddd', cursor: 'pointer', transition: 'background 0.2s' },
  dotActive: { background: '#1976D2' },
};
