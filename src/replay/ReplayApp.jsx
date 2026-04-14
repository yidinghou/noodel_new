import { useState, useEffect, useCallback } from 'react';
import Board from '../components/Grid/Board.jsx';
import { useReplaySession } from './useReplaySession.js';
import { GRID_SIZE } from '../utils/gameConstants.js';

// ─── Turn list sidebar ────────────────────────────────────────────────────────

function TurnList({ turns, currentIdx, onSelect }) {
  return (
    <div className="turn-list">
      {turns.map((turn, i) => {
        const words = turn.events.filter(e => e.type === 'WORDS_CLEARED');
        return (
          <div
            key={turn.dropSeq}
            className={`turn-list-item${i === currentIdx ? ' active' : ''}`}
            onClick={() => onSelect(i)}
          >
            <span className="turn-list-letter">{turn.letter}</span>
            <span className="turn-list-col">col {turn.column + 1}</span>
            {words.length > 0 && (
              <span className="turn-list-words">{words.flatMap(e => e.payload.words).length}w</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Turn detail panel ────────────────────────────────────────────────────────

function TurnDetail({ turn, stepIdx, score }) {
  const clearEvents = turn.events.filter(e => e.type === 'WORDS_CLEARED');
  const allWords = clearEvents.flatMap(e => e.payload.words);
  const totalSteps = turn.events.length; // drop + clears + gravities
  const cascadeLabel = totalSteps > 1 ? ` · step ${stepIdx + 1}/${totalSteps}` : '';

  return (
    <div className="turn-detail">
      <div className="turn-detail-header">
        Turn {turn.dropSeq + 1}{cascadeLabel}
        {score != null && <span style={{ float: 'right' }}>score: {score}</span>}
      </div>
      <div className="turn-detail-drop">
        Dropped <strong>{turn.letter}</strong> → column {turn.column + 1}
      </div>
      {allWords.map((w, i) => (
        <div key={i} className="turn-word-row">
          <span className="turn-word">{w.word}</span>
          {w.score != null && <span className="turn-score">{w.score}pts</span>}
          <span className="turn-chain" style={{ color: '#4a6fa5', fontStyle: 'italic' }}>
            ⬤{w.chainId?.slice(-4) ?? '?'}
          </span>
          <span style={{ fontWeight: 'bold', color: w.comboDepth > 1 ? '#f59e0b' : '#555' }}>
            ×{w.comboDepth}
          </span>
        </div>
      ))}
      {allWords.length === 0 && <div style={{ color: '#444' }}>— no words this turn —</div>}
    </div>
  );
}

// ─── Main replay app ──────────────────────────────────────────────────────────

export function ReplayApp() {
  const { session, turns, statesMap, preClear } = useReplaySession();
  const [turnIdx, setTurnIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0); // index into turn.events

  const turn = turns[turnIdx];

  // Compute the grid for the current step.
  // Each turn.events entry is one session event (DROP, WORDS_CLEARED, GRAVITY).
  // For a WORDS_CLEARED step we show the pre-clear grid (matched cells highlighted);
  // for all others we show the state after that event.
  const grid = (() => {
    if (!turn) return Array(GRID_SIZE).fill(null);
    const evt = turn.events[stepIdx];
    if (!evt) return Array(GRID_SIZE).fill(null);
    if (evt.type === 'WORDS_CLEARED') return preClear(evt);
    return statesMap.get(evt.seq)?.grid ?? Array(GRID_SIZE).fill(null);
  })();

  const score = (() => {
    if (!turn) return null;
    const evt = turn.events[stepIdx];
    if (!evt) return null;
    return statesMap.get(evt.seq)?.score ?? null;
  })();

  const canGoBack = turnIdx > 0 || stepIdx > 0;
  const canGoFwd = turn && (stepIdx < turn.events.length - 1 || turnIdx < turns.length - 1);

  const advance = useCallback(() => {
    if (!turn) return;
    if (stepIdx < turn.events.length - 1) {
      setStepIdx(s => s + 1);
    } else if (turnIdx < turns.length - 1) {
      setTurnIdx(t => t + 1);
      setStepIdx(0);
    }
  }, [turn, turnIdx, stepIdx, turns.length]);

  const retreat = useCallback(() => {
    if (stepIdx > 0) {
      setStepIdx(s => s - 1);
    } else if (turnIdx > 0) {
      const prev = turns[turnIdx - 1];
      setTurnIdx(t => t - 1);
      setStepIdx(Math.max(0, prev.events.length - 1));
    }
  }, [turnIdx, stepIdx, turns]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') advance();
      if (e.key === 'ArrowLeft') retreat();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance, retreat]);

  if (!session) {
    return (
      <div className="replay-root">
        <div className="no-session">
          No saved session found.<br />
          <a href="/noodel_new/">Play a game first</a>, then return here.
        </div>
      </div>
    );
  }

  if (!turns.length) {
    return (
      <div className="replay-root">
        <div className="no-session">
          Session found but no turns recorded yet.<br />
          <a href="/noodel_new/">Play a few turns</a>, then come back.
        </div>
      </div>
    );
  }

  return (
    <div className="replay-root">
      <aside className="replay-sidebar">
        <div className="replay-session-info">
          {session.gameMode} · {turns.length} turns
        </div>
        <TurnList
          turns={turns}
          currentIdx={turnIdx}
          onSelect={(i) => { setTurnIdx(i); setStepIdx(0); }}
        />
      </aside>

      <main className="replay-main">
        <div className="replay-nav">
          <button onClick={retreat} disabled={!canGoBack}>←</button>
          <span>
            Turn {turnIdx + 1}/{turns.length}
            {turn?.events.length > 1 && ` · step ${stepIdx + 1}/${turn.events.length}`}
          </span>
          <button onClick={advance} disabled={!canGoFwd}>→</button>
        </div>

        <div className="replay-grid-wrapper">
          <Board grid={grid} onColumnClick={null} visible />
        </div>

        {turn && <TurnDetail turn={turn} stepIdx={stepIdx} score={score} />}
      </main>
    </div>
  );
}
