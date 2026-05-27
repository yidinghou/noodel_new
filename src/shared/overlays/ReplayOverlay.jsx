import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import Board from '../../themes/classic/components/Grid/Board.jsx';
import NextPreview from '../../themes/classic/components/Controls/NextPreview.jsx';
import DroppingOverlay from './DroppingOverlay.jsx';
import { gameReducer, initialState } from '../../context/GameReducer.js';
import { createPlayer } from '../../services/replayPlayer.js';
import { GRID_COLS, GRID_ROWS } from '../../utils/gameConstants.js';
import { A } from '../../utils/actionTypes.js';
import './ReplayOverlay.css';

const SPEED_OPTIONS = [1, 2];

// Convert layout-viewport coordinates from getBoundingClientRect() into visual-viewport
// coordinates for position:fixed elements, accounting for mobile pinch-zoom offsets
function getVVOffset() {
  return {
    x: window.visualViewport?.offsetLeft ?? 0,
    y: window.visualViewport?.offsetTop ?? 0,
  };
}

function ReplayOverlay({ session, meta, onClose }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [progress, setProgress] = useState({ index: 0, total: 0, playing: false, speed: 1 });
  const [activeDrop, setActiveDrop] = useState(null);

  // Latest state mirror so the wrapped dispatch can compute drop geometry from
  // the pre-drop grid/queue without re-creating the player.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Refs measured at render time by Board / NextPreview.
  const gridRef = useRef(null);
  const nextUpRef = useRef(null);

  // Token to invalidate in-flight drop animations on restart/dispose so a
  // late-firing onComplete can't dispatch into a freshly reset reducer.
  const dropTokenRef = useRef(0);

  const playerRef = useRef(null);

  // Wrapped dispatch — intercepts DROP_LETTER to play a falling-tile animation
  // before applying the action. All other actions pass through synchronously.
  const wrappedDispatch = useCallback((action) => {
    if (action.type !== A.DROP_LETTER) {
      dispatch(action);
      return;
    }
    const column = action.payload.column;
    const grid = stateRef.current.grid;
    const queue = stateRef.current.nextQueue;

    let destRow = -1;
    for (let row = GRID_ROWS - 1; row >= 0; row--) {
      if (!grid[row * GRID_COLS + column]) { destRow = row; break; }
    }

    if (
      destRow === -1 ||
      !queue.length ||
      !gridRef.current ||
      !nextUpRef.current
    ) {
      dispatch(action);
      return;
    }

    const fromRect = nextUpRef.current.getBoundingClientRect();
    const gridRect = gridRef.current.getBoundingClientRect();
    const colWidth = gridRect.width / GRID_COLS;
    const rowHeight = gridRect.height / GRID_ROWS;
    const cellSize = Math.min(colWidth, rowHeight);
    const colLeft = gridRect.left + column * colWidth + (colWidth - cellSize) / 2;

    const token = dropTokenRef.current;
    const id = `replay-drop-${token}-${Date.now()}`;
    const vv = getVVOffset();

    return new Promise((resolve) => {
      setActiveDrop({
        id,
        column,
        letter: queue[0].char,
        from: { x: fromRect.left - vv.x, y: fromRect.top - vv.y },
        toTop: { x: colLeft - vv.x, y: gridRect.top - vv.y },
        toFinal: { x: colLeft - vv.x, y: gridRect.top + destRow * rowHeight - vv.y },
        cellSize,
        onComplete: () => {
          // If a restart happened mid-animation, drop this dispatch on the floor.
          if (token !== dropTokenRef.current) {
            setActiveDrop(null);
            resolve();
            return;
          }
          setActiveDrop(null);
          dispatch(action);
          resolve();
        },
      });
    });
  }, []);

  useEffect(() => {
    if (!session || !Array.isArray(session.events) || session.events.length === 0) return;
    const player = createPlayer(session.events, wrappedDispatch, {
      reset: () => {
        dropTokenRef.current += 1; // invalidate any in-flight drop animation
        setActiveDrop(null);
        dispatch({ type: A.RESET });
      },
      fastDispatch: dispatch,
    });
    playerRef.current = player;
    const unsubscribe = player.subscribe(setProgress);
    player.play(); // auto-play
    return () => {
      dropTokenRef.current += 1; // cancel any in-flight drop dispatches
      unsubscribe();
      player.dispose();
      playerRef.current = null;
    };
  }, [session, wrappedDispatch]);

  if (!session) return null;

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (progress.playing) p.pause();
    else p.play();
  };

  const restart = () => {
    dropTokenRef.current += 1; // invalidate any in-flight drop
    setActiveDrop(null);
    playerRef.current?.restart();
  };

  const setSpeed = (mult) => {
    playerRef.current?.setSpeed(mult);
  };

  const stepBack = () => { playerRef.current?.stepBackward(); };
  const stepForward = () => { playerRef.current?.stepForward(); };

  const pct = progress.total > 0 ? (progress.index / progress.total) * 100 : 0;
  const done = progress.index >= progress.total && progress.total > 0;
  const bounds = playerRef.current?.getBoundaries() ?? { first: 0, last: progress.total };
  const canStepBack = progress.index > bounds.first;
  const canStepForward = progress.index < bounds.last;

  return (
    <div className="replay-overlay">
      <div className="replay-overlay-backdrop" onClick={onClose} />
      <div className="replay-overlay-panel">
        <div className="replay-overlay-header">
          <div className="replay-overlay-summary">
            <span className="replay-overlay-score">SCORE: {meta?.score ?? '—'}</span>
            {meta?.createdAt && (
              <span className="replay-overlay-date">
                {new Date(meta.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
          <button className="replay-overlay-close" onClick={onClose} aria-label="Close replay">×</button>
        </div>

        <div className="replay-overlay-preview">
          <NextPreview
            nextLetters={state.nextQueue.slice(0, 5).map(item => item.char)}
            visible={true}
            nextUpRef={nextUpRef}
          />
        </div>

        <div className="replay-overlay-board">
          <Board grid={state.grid} onColumnClick={null} gridRef={gridRef} />
        </div>

        <div className="replay-progress">
          <div className="replay-progress-fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="replay-overlay-controls">
          <button onClick={togglePlay} className="replay-btn" aria-label={progress.playing ? 'Pause' : 'Play'}>
            {done ? '↻' : progress.playing ? '⏸' : '▶'}
          </button>
          <button onClick={restart} className="replay-btn" aria-label="Restart">↺</button>
          <button onClick={stepBack} className="replay-btn" disabled={!canStepBack} aria-label="Step back one turn">◀</button>
          <button onClick={stepForward} className="replay-btn" disabled={!canStepForward} aria-label="Step forward one turn">▶|</button>
          <div className="replay-speed">
            {SPEED_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`replay-btn replay-btn-speed${progress.speed === s ? ' active' : ''}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeDrop && (
        <DroppingOverlay
          key={activeDrop.id}
          id={activeDrop.id}
          column={activeDrop.column}
          letter={activeDrop.letter}
          from={activeDrop.from}
          toTop={activeDrop.toTop}
          toFinal={activeDrop.toFinal}
          cellSize={activeDrop.cellSize}
          onComplete={activeDrop.onComplete}
        />
      )}
    </div>
  );
}

export default ReplayOverlay;
