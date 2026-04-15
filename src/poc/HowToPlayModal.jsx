import { useState } from 'react';
import AnimatedDemo from './AnimatedDemo.jsx';
import { PANELS } from './constants.js';

export default function HowToPlayModal({ onClose = () => {} } = {}) {
  const [panelIdx, setPanelIdx] = useState(0);
  const panel = PANELS[panelIdx];
  const isFirst = panelIdx === 0;
  const isLast  = panelIdx === PANELS.length - 1;

  return (
    <div style={m.backdrop} onClick={onClose}>
      <div style={m.modal} onClick={e => e.stopPropagation()}>

        <h2 style={m.title}>How to Play</h2>

        {/* Panel content */}
        <div style={m.panelContent}>
          {panel.steps.map(step => (
            <div key={step.number} style={m.step}>
              <div style={m.stepHeader}>
                <span style={m.stepNumber}>{step.number}</span>
                <span style={m.stepTitle}>{step.title}</span>
              </div>
              <p style={m.stepDesc}>{step.description}</p>
            </div>
          ))}

          <AnimatedDemo key={panelIdx} demoType={panel.demoType} />
        </div>

        {/* Nav row */}
        <div style={m.navRow}>
          <button
            style={{ ...m.arrowBtn, opacity: isFirst ? 0.3 : 1 }}
            onClick={() => setPanelIdx(i => i - 1)}
            disabled={isFirst}
            aria-label="Previous"
          >
            ‹
          </button>

          <div style={m.dots}>
            {PANELS.map((_, i) => (
              <button
                key={i}
                style={{ ...m.dot, ...(i === panelIdx ? m.dotActive : {}) }}
                onClick={() => setPanelIdx(i)}
                aria-label={`Panel ${i + 1}`}
              />
            ))}
          </div>

          <button
            style={{ ...m.arrowBtn, opacity: isLast ? 0.3 : 1 }}
            onClick={() => setPanelIdx(i => i + 1)}
            disabled={isLast}
            aria-label="Next"
          >
            ›
          </button>
        </div>

        {isLast && (
          <button style={m.gotItBtn} onClick={onClose}>Got it</button>
        )}

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
    maxWidth: 340, width: '92%', maxHeight: '85vh',
    boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    overflowY: 'auto',
  },
  title: { fontSize: 20, fontWeight: 700, color: '#333', margin: 0 },
  panelContent: {
    width: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 12,
  },
  step: {
    width: '100%', display: 'flex', flexDirection: 'column', gap: 4,
  },
  stepHeader: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  stepNumber: {
    width: 22, height: 22, borderRadius: '50%',
    background: '#1976D2', color: '#fff',
    fontSize: 12, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  stepTitle: {
    fontSize: 14, fontWeight: 700, color: '#1976D2',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  stepDesc: {
    fontSize: 13, color: '#555', lineHeight: 1.4,
    margin: '0 0 0 30px',
  },
  navRow: {
    width: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 4,
  },
  arrowBtn: {
    background: 'none', border: 'none', fontSize: 28,
    color: '#1976D2', cursor: 'pointer', padding: '4px 10px',
    lineHeight: 1, borderRadius: 6,
    transition: 'opacity 0.15s', userSelect: 'none',
  },
  dots: {
    display: 'flex', gap: 8, alignItems: 'center',
  },
  dot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#ccc', border: 'none', padding: 0,
    cursor: 'pointer', transition: 'background 0.2s, transform 0.2s',
  },
  dotActive: {
    background: '#1976D2', transform: 'scale(1.25)',
  },
  gotItBtn: {
    width: '100%', padding: '10px 0', borderRadius: 8,
    background: '#1976D2', color: '#fff', border: 'none',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    marginTop: 4,
  },
};
