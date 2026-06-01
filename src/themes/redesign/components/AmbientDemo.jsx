import { useEffect, useRef, useState } from 'react';
import Board, { CELL, STEP } from './Board.jsx';
import { useAmbientDemo } from '../../../hooks/useAmbientDemo.js';
import DroppingOverlay from '../../../shared/overlays/DroppingOverlay.jsx';

export { useAmbientDemo };

export function AmbientBoard({ grid, dropping, highlight, firstTileRef }) {
  const boardRef = useRef(null);
  const containerRef = useRef(null);
  const [dropState, setDropState] = useState(null);

  useEffect(() => {
    if (dropping?.phase === 'falling') {
      const tileEl = firstTileRef?.current;
      const boardEl = boardRef.current;
      const containerEl = containerRef.current;
      if (!tileEl || !boardEl || !containerEl) return;
      const tileRect = tileEl.getBoundingClientRect();
      const boardRect = boardEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      const col = dropping.col;
      const dr = dropping.destRow;
      const colLeft = boardRect.left + col * STEP + (STEP - CELL) / 2;
      setDropState({
        id: `rd-ambient-${col}-${dr}-${Date.now()}`,
        letter: dropping.letter,
        from:    { x: tileRect.left - containerRect.left, y: tileRect.top - containerRect.top },
        toTop:   { x: colLeft - containerRect.left,       y: boardRect.top - containerRect.top },
        toFinal: { x: colLeft - containerRect.left,       y: boardRect.top + dr * STEP - containerRect.top },
        cellSize: CELL,
      });
    } else if (!dropping) {
      setDropState(null);
    }
  }, [dropping, firstTileRef]);

  const cells = grid.map((letter) =>
    letter ? { ch: letter, state: 'filled' } : null
  );

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div ref={boardRef} className="rd-ambient-demo" aria-hidden="true">
        <Board cells={cells} highlightSet={highlight} />
      </div>
      {dropState && (
        <DroppingOverlay key={dropState.id} {...dropState} className="rd-dropping-ambient" opacity={0.4} onComplete={() => {}} />
      )}
    </div>
  );
}

export default function AmbientDemo() {
  const state = useAmbientDemo();
  return <AmbientBoard {...state} />;
}
