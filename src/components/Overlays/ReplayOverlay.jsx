import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Board from '../Grid/Board.jsx';
import NextPreview from '../Controls/NextPreview.jsx';

/**
 * Build a flat replay timeline from a session.
 *
 * Each entry is either:
 *   'word-highlight' — the pre-removal grid with matched cells highlighted green
 *   'snapshot'       — the stable grid after a drop or word clear + gravity
 *
 * DROP_LETTER events either have a post-gravity snapshot (clean drop) or a
 * postDropGrid (drop while words were pending). WORD_CLEARED events always
 * have a preRemoveGrid edge step followed by a post-gravity snapshot.
 */
function buildTimeline(session) {
  if (!session?.events || !session?.snapshotHistory) return [];

  // O(1) lookup: afterEventSeq → snapshot
  const seqToSnapshot = new Map(
    session.snapshotHistory.map(snap => [snap.afterEventSeq, snap])
  );

  const timeline = [];
  let dropNumber = 0;
  let lastKnownNextQueue = [];

  for (const event of session.events) {
    if (event.type === 'WORD_CLEARED') {
      const snapshot = seqToSnapshot.get(event.seq);
      const allIndices = (event.wordsCleared || []).flatMap(w => w.indices || []);
      const nextQueue = snapshot?.nextQueue || lastKnownNextQueue;

      if (event.preRemoveGrid) {
        timeline.push({
          type: 'word-highlight',
          dropNumber,
          grid: event.preRemoveGrid,
          highlightIndices: allIndices,
          wordNames: (event.wordsCleared || []).map(w => w.word),
          score: snapshot?.score,
          lettersRemaining: snapshot?.lettersRemaining,
          nextQueue,
        });
      }

      if (snapshot) {
        lastKnownNextQueue = snapshot.nextQueue || lastKnownNextQueue;
        timeline.push({
          type: 'snapshot',
          dropNumber,
          grid: snapshot.grid,
          wordNames: [],
          score: snapshot.score,
          lettersRemaining: snapshot.lettersRemaining,
          nextQueue: lastKnownNextQueue,
        });
      }
    } else if (event.type === 'DROP_LETTER') {
      dropNumber++;
      const snapshot = seqToSnapshot.get(event.seq);

      if (snapshot) {
        lastKnownNextQueue = snapshot.nextQueue || lastKnownNextQueue;
        timeline.push({
          type: 'snapshot',
          dropNumber,
          grid: snapshot.grid,
          wordNames: [],
          score: snapshot.score,
          lettersRemaining: snapshot.lettersRemaining,
          nextQueue: lastKnownNextQueue,
        });
      } else if (event.postDropGrid) {
        lastKnownNextQueue = event.postDropNextQueue || lastKnownNextQueue;
        timeline.push({
          type: 'snapshot',
          dropNumber,
          grid: event.postDropGrid,
          wordNames: [],
          score: event.postDropScore,
          lettersRemaining: event.postDropLettersRemaining,
          nextQueue: lastKnownNextQueue,
        });
      }
    }
  }

  return timeline;
}

/** Return grid with isMatched:true on the given indices. */
function applyHighlight(grid, indices) {
  if (!indices?.length) return grid;
  const indexSet = new Set(indices);
  return grid.map((cell, i) => (indexSet.has(i) && cell ? { ...cell, isMatched: true } : cell));
}

/** Header label: word names for highlight steps, move number for snapshots. */
function stepLabel(step, stepIndex, total) {
  if (!step) return `Replay (0/${total})`;
  const pos = `(${stepIndex + 1}/${total})`;
  return step.type === 'word-highlight'
    ? `${step.wordNames.join(' · ')} ${pos}`
    : `Move ${step.dropNumber} ${pos}`;
}

/**
 * Replay Overlay — step-by-step playback of a completed game session.
 *
 * Each word-clear appears as a "half step" showing letters highlighted green
 * before they disappear, so players can see exactly which words fired and when.
 */
function ReplayOverlay({ visible, onClose, session }) {
  const [stepIndex, setStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeLogEntryRef = useRef(null);

  const timeline = useMemo(() => buildTimeline(session), [session]);
  const totalSteps = timeline.length;
  const isAtEnd = stepIndex >= totalSteps - 1;
  const currentStep = timeline[stepIndex] ?? null;

  // Word log: one entry per word-highlight step
  const wordLog = useMemo(() =>
    timeline.flatMap((step, idx) =>
      step.type === 'word-highlight'
        ? [{ timelineIdx: idx, dropNumber: step.dropNumber, wordNames: step.wordNames }]
        : []
    ),
    [timeline]
  );

  // The most recent word-highlight step at or before the current position
  const activeLogIdx = useMemo(() => {
    for (let i = stepIndex; i >= 0; i--) {
      if (timeline[i]?.type === 'word-highlight') {
        return wordLog.findIndex(e => e.timelineIdx === i);
      }
    }
    return -1;
  }, [stepIndex, timeline, wordLog]);

  useEffect(() => {
    activeLogEntryRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeLogIdx]);

  const displayGrid = useMemo(() => {
    if (!currentStep) return [];
    return currentStep.type === 'word-highlight'
      ? applyHighlight(currentStep.grid, currentStep.highlightIndices)
      : currentStep.grid;
  }, [currentStep]);

  // Auto-play: word-highlight steps pause 700 ms so the green is visible
  useEffect(() => {
    if (!isPlaying || isAtEnd || totalSteps === 0) return;

    const delay = currentStep?.type === 'word-highlight' ? 700 : 1000;
    const id = setTimeout(() => {
      setStepIndex(prev => {
        const next = prev + 1;
        if (next >= totalSteps) { setIsPlaying(false); return prev; }
        return next;
      });
    }, delay);

    return () => clearTimeout(id);
  }, [isPlaying, totalSteps, isAtEnd, stepIndex, currentStep]);

  // Reset when overlay closes
  useEffect(() => {
    if (!visible) {
      setIsPlaying(false);
      setStepIndex(-1);
    }
  }, [visible]);

  if (!visible || !session) return null;

  const handlePlayPause = () => {
    if (isAtEnd) { setStepIndex(0); setIsPlaying(true); }
    else setIsPlaying(p => !p);
  };

  const handleNext = () => { if (stepIndex < totalSteps - 1) { setStepIndex(s => s + 1); setIsPlaying(false); } };
  const handlePrev = () => { if (stepIndex > 0) { setStepIndex(s => s - 1); setIsPlaying(false); } };

  return (
    <div className="replay-overlay-backdrop">
      <div className="replay-overlay">

        <div className="replay-header">
          <h3>{stepLabel(currentStep, stepIndex, totalSteps)}</h3>
          <button className="replay-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="replay-main-row">
          <div className="replay-board-col">
            <div className="replay-next-preview">
              <NextPreview
                nextLetters={(currentStep?.nextQueue || []).slice(0, 5).map(q => q.char)}
                visible={!!currentStep}
              />
            </div>
            <div className="replay-grid-container">
              <Board grid={displayGrid} onColumnClick={() => {}} showPreview={false} />
            </div>
          </div>

          <div className="replay-side-col">
            <div className="replay-stats">
              {currentStep && (
                <>
                  <span>Score: {currentStep.score}</span>
                  <span>Letters: {currentStep.lettersRemaining}</span>
                </>
              )}
            </div>

            <div className="replay-log">
              {wordLog.length === 0 && (
                <span className="replay-log-empty">No words yet</span>
              )}
              {wordLog.map((entry, i) => {
                const isActive = i === activeLogIdx;
                return (
                  <div
                    key={entry.timelineIdx}
                    ref={isActive ? activeLogEntryRef : null}
                    className={`replay-log-entry${isActive ? ' active' : ''}`}
                    onClick={() => { setStepIndex(entry.timelineIdx); setIsPlaying(false); }}
                  >
                    <span className="replay-log-move">#{entry.dropNumber}</span>
                    <span className="replay-log-words">{entry.wordNames.join(' · ')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="replay-controls">
          <div className="replay-buttons">
            <button className="replay-btn" onClick={handlePrev} disabled={stepIndex <= 0}>◀ Prev</button>
            <button className="replay-btn play-btn" onClick={handlePlayPause}>
              {isPlaying ? '⏸ Pause' : isAtEnd ? '↻ Replay' : '▶ Play'}
            </button>
            <button className="replay-btn" onClick={handleNext} disabled={stepIndex >= totalSteps - 1}>Next ▶</button>
          </div>
        </div>

        <div className="replay-progress-bar">
          <div
            className="replay-progress-fill"
            style={{ width: `${totalSteps > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0}%` }}
          />
        </div>

      </div>
    </div>
  );
}

export default ReplayOverlay;
