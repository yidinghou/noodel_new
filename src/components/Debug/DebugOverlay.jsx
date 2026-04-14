import { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext.jsx';

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: 'min(340px, 100vw)',
    maxHeight: '90vh',
    overflowY: 'auto',
    backgroundColor: 'rgba(10, 10, 10, 0.92)',
    color: '#e2e2e2',
    fontFamily: 'monospace',
    fontSize: '12px',
    zIndex: 9999,
    padding: '12px',
    borderLeft: '2px solid #444',
    borderBottom: '2px solid #444',
  },
  header: {
    color: '#aaa',
    marginBottom: '10px',
    letterSpacing: '0.1em',
    borderBottom: '1px solid #333',
    paddingBottom: '6px',
  },
  sectionTitle: {
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    margin: '10px 0 4px',
    fontSize: '10px',
  },
  row: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    padding: '2px 0',
    borderBottom: '1px solid #1a1a1a',
  },
  word: { color: '#fff', fontWeight: 'bold', minWidth: '60px' },
  meta: { color: '#666' },
  chain: { color: '#4a6fa5', fontStyle: 'italic' },
  eventRow: {
    display: 'flex',
    gap: '8px',
    padding: '2px 0',
    borderBottom: '1px solid #1a1a1a',
    flexWrap: 'wrap',
  },
  eventPayload: { color: '#666', wordBreak: 'break-all' },
};

function depthStyle(depth) {
  return { fontWeight: 'bold', color: depth > 1 ? '#f59e0b' : '#555', minWidth: '24px' };
}

function eventTypeStyle(type) {
  return {
    color: type === 'WORDS_CLEARED' ? '#4ade80' : type === 'DROP_LETTER' ? '#60a5fa' : '#a78bfa',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
}

export function DebugOverlay() {
  const [visible, setVisible] = useState(false);
  const { state, gameSession } = useGame();

  useEffect(() => {
    const handler = (e) => { if (e.key === '`') setVisible(v => !v); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!visible) return null;

  const session = gameSession.getSavedSession();
  const recentEvents = (session?.events ?? []).slice(-10).reverse();

  return (
    <div style={styles.overlay}>
      <div style={styles.header}>
        DEBUG  [` to close]
        <a
          href="/noodel_new/game_replay.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{ float: 'right', color: '#60a5fa', fontSize: '11px', textDecoration: 'none' }}
        >
          open replay ↗
        </a>
      </div>

      <div style={styles.sectionTitle}>madeWords ({state.madeWords.length})</div>
      {state.madeWords.length === 0 && <div style={styles.meta}>— none yet —</div>}
      {state.madeWords.map((entry, i) => {
        const word  = typeof entry === 'string' ? entry : entry.word;
        const score = typeof entry === 'string' ? '?' : entry.score;
        const depth = typeof entry === 'string' ? '?' : entry.comboDepth;
        const chain = typeof entry === 'string' ? '?' : (entry.chainId?.slice(-4) ?? '?');
        return (
          <div key={i} style={styles.row}>
            <span style={styles.word}>{word}</span>
            <span style={styles.meta}>{score}pts</span>
            <span style={styles.chain}>⬤{chain}</span>
            <span style={depthStyle(depth)}>×{depth}</span>
          </div>
        );
      })}

      <div style={styles.sectionTitle}>events — last 10, newest first</div>
      {recentEvents.length === 0 && <div style={styles.meta}>— no events yet —</div>}
      {recentEvents.map((evt, i) => (
        <div key={i} style={styles.eventRow}>
          <span style={eventTypeStyle(evt.type)}>{evt.type}</span>
          <span style={styles.eventPayload}>{JSON.stringify(evt.payload)}</span>
        </div>
      ))}
    </div>
  );
}
