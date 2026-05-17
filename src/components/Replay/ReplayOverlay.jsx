import { useState, useEffect, useCallback, useRef } from 'react';
import Board from '../Grid/Board.jsx';
import DroppingOverlay from '../Grid/DroppingOverlay.jsx';
import './ReplayOverlay.css';

const SPEEDS = [
  { label: 'Slow', ms: 1400 },
  { label: 'Normal', ms: 800 },
  { label: 'Fast', ms: 350 },
];

const COLS = 7;
const ROWS = 6;

function computeDestRow(grid, column) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (!grid[row * COLS + column]) return row;
  }
  return 0;
}

function computeDropPositions(boardRef, column, destRow) {
  // Measure the inner game-grid element, not the wrapper, to match GameLayout's math exactly.
  const gridEl = boardRef.current.querySelector('.game-grid');
  const rect = (gridEl ?? boardRef.current).getBoundingClientRect();
  const colWidth = rect.width / COLS;
  const rowHeight = rect.height / ROWS;
  const cellSize = Math.min(colWidth, rowHeight);
  const colLeft = rect.left + column * colWidth + (colWidth - cellSize) / 2;
  const toTop = { x: colLeft, y: rect.top };
  const toFinal = { x: colLeft, y: rect.top + destRow * rowHeight };
  return { from: toTop, toTop, toFinal, cellSize };
}

// Pair each WORDS_CLEARED in a turn with its following GRAVITY event.
function pairClearGravity(turnEvents) {
  const pairs = [];
  for (let j = 0; j < turnEvents.length; j++) {
    if (turnEvents[j].type === 'WORDS_CLEARED') {
      const gravity = turnEvents.slice(j + 1).find(e => e.type === 'GRAVITY');
      pairs.push({ clearEvent: turnEvents[j], gravityEvent: gravity ?? null });
    }
  }
  return pairs;
}

function buildFrames(turns, statesMap, preClearGrid) {
  const frames = [];
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const dropState = statesMap.get(turn.dropSeq);
    if (!dropState) continue;
    const pairs = pairClearGravity(turn.events);

    // Pre-drop frame: board before the letter lands; DroppingOverlay animates over this.
    const preDropState = statesMap.get(turn.dropSeq - 1) ?? statesMap.get(-1);

    // Highlight any words that were already fully formed before this drop (e.g. SIP pending
    // when D is about to drop and form DIE — both clear together). A word is "pre-formed" if
    // every one of its tile indices is non-null in the pre-drop grid.
    let preDropGrid = preDropState.grid;
    if (pairs.length > 0) {
      const pendingGrid = [...preDropState.grid];
      let hasPending = false;
      for (const w of pairs[0].clearEvent.payload.words) {
        if (w.indices.every(idx => preDropState.grid[idx] != null)) {
          for (const idx of w.indices) {
            if (pendingGrid[idx]) {
              pendingGrid[idx] = { ...pendingGrid[idx], isPending: true, pendingDirections: [w.direction], pendingResetCount: 0 };
              hasPending = true;
            }
          }
        }
      }
      if (hasPending) preDropGrid = pendingGrid;
    }

    frames.push({
      grid: preDropGrid,
      score: preDropState.score,
      nextQueue: preDropState.nextQueue ?? [],
      isMatchFrame: false,
      isDropFrame: true,
      column: turn.column,
      letter: turn.letter,
      speedMultiplier: 0, // duration driven by animation, not timer
      dropIndex: i,
    });

    if (pairs.length === 0) {
      // No clear: just show the post-drop state.
      frames.push({
        grid: dropState.grid,
        score: dropState.score,
        nextQueue: dropState.nextQueue ?? [],
        isMatchFrame: false,
        speedMultiplier: 1.0,
        dropIndex: i,
      });
    } else {
      for (const { clearEvent, gravityEvent } of pairs) {
        // Grace frame: word highlighted green, matching the in-game grace period.
        const matchedGrid = preClearGrid(statesMap, clearEvent);
        const preState = statesMap.get(clearEvent.seq - 1) ?? dropState;
        frames.push({
          grid: matchedGrid,
          score: preState.score,
          nextQueue: dropState.nextQueue ?? [],
          isMatchFrame: true,
          speedMultiplier: 0.5,
          dropIndex: i,
        });

        // Settled frame: post-gravity (tiles cleared and gravity applied, no holes).
        const settledSeq = gravityEvent ? gravityEvent.seq : clearEvent.seq;
        const settledState = statesMap.get(settledSeq);
        if (settledState) {
          frames.push({
            grid: settledState.grid,
            score: settledState.score,
            nextQueue: dropState.nextQueue ?? [],
            isMatchFrame: false,
            speedMultiplier: 0.5,
            dropIndex: i,
          });
        }
      }
    }
  }

  return frames;
}

export default function ReplayOverlay({ session, onClose }) {
  const [replayData, setReplayData] = useState(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speedIdx, setSpeedIdx] = useState(1);
  const boardRef = useRef(null);

  useEffect(() => {
    import('../../services/replayEngine.js').then(({ buildTurns, buildReplayStates, preClearGrid }) => {
      const turns = buildTurns(session);
      const statesMap = buildReplayStates(session);
      const frames = buildFrames(turns, statesMap, preClearGrid);
      setReplayData({ frames });
    });
  }, [session]);

  useEffect(() => {
    if (!playing || !replayData) return;
    if (frameIdx >= replayData.frames.length - 1) { setPlaying(false); return; }
    const frame = replayData.frames[frameIdx];
    // Drop frames are advanced by the DroppingOverlay's onComplete, not by a timer.
    if (frame.isDropFrame) return;
    const t = setTimeout(() => setFrameIdx(i => i + 1), SPEEDS[speedIdx].ms * frame.speedMultiplier);
    return () => clearTimeout(t);
  }, [playing, frameIdx, replayData, speedIdx]);

  const cycleSpeed = useCallback(() => setSpeedIdx(i => (i + 1) % SPEEDS.length), []);

  const prev = useCallback(() => {
    setPlaying(false);
    setFrameIdx(i => Math.max(0, i - 1));
  }, []);

  const next = useCallback(() => {
    setPlaying(false);
    setFrameIdx(i => Math.min((replayData?.frames.length ?? 1) - 1, i + 1));
  }, [replayData]);

  const frame = replayData?.frames[frameIdx];
  const totalFrames = replayData?.frames.length ?? 0;

  const totalDrops = replayData ? (replayData.frames[replayData.frames.length - 1]?.dropIndex ?? 0) + 1 : 0;
  const currentDrop = (frame?.dropIndex ?? 0) + 1;
  const progress = totalDrops > 1 ? (currentDrop / totalDrops) * 100 : 0;

  // CSS variable for the grace period fill animation duration — matches the frame hold time.
  const graceDuration = `${SPEEDS[speedIdx].ms * 0.5}ms`;

  const username = session?.checkpoint?.username ?? session?.username ?? '';
  const gameMode = session?.checkpoint?.gameMode ?? session?.gameMode ?? 'classic';
  const finalScore = session?.checkpoint?.score ?? 0;
  const displayScore = gameMode === 'clear' ? finalScore : (frame?.score ?? 0);

  // Compute drop animation props when on a drop frame and the board is mounted.
  let dropOverlay = null;
  if (frame?.isDropFrame && boardRef.current) {
    const destRow = computeDestRow(frame.grid, frame.column);
    const { from, toTop, toFinal, cellSize } = computeDropPositions(boardRef, frame.column, destRow);
    dropOverlay = (
      <DroppingOverlay
        key={frameIdx}
        id={frameIdx}
        column={frame.column}
        letter={frame.letter}
        from={from}
        toTop={toTop}
        toFinal={toFinal}
        cellSize={cellSize}
        onComplete={() => { if (playing) setFrameIdx(i => i + 1); }}
      />
    );
  }

  return (
    <div className="replay-backdrop" onClick={onClose}>
      <div className="replay-card" onClick={e => e.stopPropagation()}>
        <div className="replay-header">
          <span className="replay-title">
            {username ? `Watching: ${username}` : 'Replay'}
          </span>
          <span className="replay-score-badge">{displayScore} pts</span>
          <button className="replay-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {!replayData ? (
          <div className="replay-loading">Loading…</div>
        ) : (
          <>
            <div className="replay-next-queue">
              {(frame?.nextQueue ?? []).slice(0, 5).map((item, i) => (
                <span
                  key={i}
                  className={`replay-next-chip${i === 0 ? ' replay-next-chip--next' : ''}`}
                >
                  {item.char}
                </span>
              ))}
            </div>

            <div
              ref={boardRef}
              className="replay-board-wrapper"
              style={{ '--animation-duration-word-grace': graceDuration }}
            >
              <Board grid={frame?.grid ?? Array(42).fill(null)} visible />
              {dropOverlay}
            </div>

            <div className="replay-progress-bar-track">
              <div className="replay-progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="replay-controls">
              <button
                className="replay-nav-btn"
                onClick={prev}
                disabled={frameIdx === 0}
                aria-label="Previous"
              >
                ◀
              </button>

              <button
                className="replay-play-btn"
                onClick={() => {
                  if (!playing && frameIdx >= totalFrames - 1) {
                    setFrameIdx(0);
                    setPlaying(true);
                  } else {
                    setPlaying(p => !p);
                  }
                }}
                aria-label={playing ? 'Pause' : (frameIdx >= totalFrames - 1 ? 'Restart' : 'Play')}
              >
                {playing ? '⏸' : (frameIdx >= totalFrames - 1 ? '↩' : '▶')}
              </button>

              <button
                className="replay-nav-btn"
                onClick={next}
                disabled={frameIdx >= totalFrames - 1}
                aria-label="Next"
              >
                ▶
              </button>

              <span className="replay-turn-info">
                {currentDrop} / {totalDrops}
              </span>

              <button className="replay-speed-btn" onClick={cycleSpeed}>
                {SPEEDS[speedIdx].label}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
