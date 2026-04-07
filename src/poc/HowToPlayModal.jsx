import { useState } from 'react';
import AnimatedDemo from './AnimatedDemo.jsx';
import { STEPS } from './constants.js';

export default function HowToPlayModal({ onClose = () => {} } = {}) {
  const [exampleIdx, setExampleIdx] = useState(0);
  const current = STEPS[exampleIdx];

  return (
    <div style={m.backdrop} onClick={onClose}>
      <div style={m.modal} onClick={e => e.stopPropagation()}>

        <h2 style={m.title}>How to Play</h2>

        {/* Steps (text only) */}
        <div style={m.steps}>
          {STEPS.map(step => (
            <div key={step.number} style={m.step}>
              <div style={m.stepHeader}>
                <span style={m.stepNumber}>{step.number}</span>
                <span style={m.stepTitle}>{step.title}</span>
              </div>
              <p style={m.stepDesc}>{step.description}</p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <hr style={m.divider} />

        {/* Examples panel */}
        <div style={m.exampleSection}>
          <div style={m.exampleTabs}>
            {STEPS.map((step, i) => (
              <button
                key={i}
                style={{ ...m.tab, ...(i === exampleIdx ? m.tabActive : {}) }}
                onClick={() => setExampleIdx(i)}
              >
                {step.title}
              </button>
            ))}
          </div>

          <AnimatedDemo key={exampleIdx} demoType={current.demoType} />
        </div>

        <button style={m.gotItBtn} onClick={onClose}>Got it</button>

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
  steps: {
    width: '100%', display: 'flex', flexDirection: 'column', gap: 16,
  },
  step: {
    display: 'flex', flexDirection: 'column', gap: 4,
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
  divider: {
    width: '100%', border: 'none',
    borderTop: '1px solid #e0e0e0', margin: '4px 0',
  },
  exampleSection: {
    width: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 12,
  },
  exampleTabs: {
    display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden',
    border: '2px solid #1976D2',
  },
  tab: {
    padding: '6px 20px', fontSize: 12, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.04em',
    border: 'none', cursor: 'pointer',
    background: '#fff', color: '#1976D2',
    transition: 'background 0.15s, color 0.15s',
  },
  tabActive: {
    background: '#1976D2', color: '#fff',
  },
  gotItBtn: {
    width: '100%', padding: '10px 0', borderRadius: 8,
    background: '#1976D2', color: '#fff', border: 'none',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    marginTop: 4,
  },
};
