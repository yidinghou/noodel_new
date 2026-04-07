import AnimatedDemo from './AnimatedDemo.jsx';
import { STEPS } from './constants.js';

export default function HowToPlayModal({ onClose = () => {} } = {}) {
  return (
    <div style={m.backdrop} onClick={onClose}>
      <div style={m.modal} onClick={e => e.stopPropagation()}>

        <h2 style={m.title}>How to Play</h2>

        <div style={m.scrollArea}>
          {STEPS.map(step => (
            <div key={step.number} style={m.step}>
              <div style={m.stepHeader}>
                <span style={m.stepNumber}>{step.number}</span>
                <span style={m.stepTitle}>{step.title}</span>
              </div>
              <p style={m.stepDesc}>{step.description}</p>
              <AnimatedDemo demoType={step.demoType} />
            </div>
          ))}
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
  },
  title: { fontSize: 20, fontWeight: 700, color: '#333', margin: 0 },
  scrollArea: {
    overflowY: 'auto', flex: 1, width: '100%',
    display: 'flex', flexDirection: 'column', gap: 24,
  },
  step: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  },
  stepHeader: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  stepNumber: {
    width: 24, height: 24, borderRadius: '50%',
    background: '#1976D2', color: '#fff',
    fontSize: 13, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 14, fontWeight: 700, color: '#1976D2',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  stepDesc: {
    fontSize: 13, color: '#555', textAlign: 'center',
    lineHeight: 1.4, margin: 0, maxWidth: 260,
  },
  gotItBtn: {
    width: '100%', padding: '10px 0', borderRadius: 8,
    background: '#1976D2', color: '#fff', border: 'none',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    marginTop: 4,
  },
};
