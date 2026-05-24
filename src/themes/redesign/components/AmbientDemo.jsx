import { useEffect, useRef, useState } from 'react';
import Board, { CELL, STEP } from './Board.jsx';
import { useAmbientDemo } from '../../../hooks/useAmbientDemo.js';
import DroppingOverlay from '../../../shared/overlays/DroppingOverlay.jsx';

export { useAmbientDemo };

export function AmbientBoard({ grid, dropping, highlight, firstTileRef }) {
  const boardRef = useRef(null);
  const [dropState, setDropState] = useState(null);

  useEffect(() => {
    if (dropping?.phase === 'falling') {
      const tileEl = firstTileRef?.current;
      const boardEl = boardRef.current;
      if (!tileEl || !boardEl) return;
      const tileRect = tileEl.getBoundingClientRect();
      const boardRect = boardEl.getBoundingClientRect();
      const col = dropping.col;
      const dr = dropping.destRow;
      const colLeft = boardRect.left + col * STEP + (STEP - CELL) / 2;
      setDropState({
        id: `rd-ambient-${col}-${dr}-${Date.now()}`,
        letter: dropping.letter,
        from: { x: tileRect.left, y: tileRect.top },
        toTop: { x: colLeft, y: boardRect.top },
        toFinal: { x: colLeft, y: boardRect.top + dr * STEP },
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
    <>
      <div ref={boardRef} className="rd-ambient-demo" aria-hidden="true">
        <Board cells={cells} highlightSet={highlight} />
      </div>
      {dropState && (
        <DroppingOverlay key={dropState.id} {...dropState} className="rd-dropping-ambient" opacity={0.4} onComplete={() => {}} />
      )}
    </>
  );
}

export default function AmbientDemo() {
  const state = useAmbientDemo();
  return <AmbientBoard {...state} />;
}
