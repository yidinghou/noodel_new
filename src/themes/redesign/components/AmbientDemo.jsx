import { useEffect, useRef, useState } from 'react';
import Board from './Board.jsx';
import { useAmbientDemo } from '../../../hooks/useAmbientDemo.js';
import DroppingOverlay from '../../../shared/overlays/DroppingOverlay.jsx';
import { computeDropCoords } from '../../../utils/dropCoordUtils.js';

export { useAmbientDemo };

export function AmbientBoard({ grid, dropping, highlight }) {
  const gridRef = useRef(null);
  const containerRef = useRef(null);
  const anchorRef = useRef(null);
  const [dropState, setDropState] = useState(null);

  useEffect(() => {
    if (dropping?.phase === 'falling') {
      const tileEl = anchorRef.current;
      const gridEl = gridRef.current;
      const containerEl = containerRef.current;
      if (!tileEl || !gridEl || !containerEl) return;
      const col = dropping.col;
      const dr = dropping.destRow;
      const coords = computeDropCoords(containerEl, tileEl, gridEl, col, dr);
      setDropState({
        id: `rd-ambient-${col}-${dr}-${Date.now()}`,
        letter: dropping.letter,
        ...coords,
      });
    } else if (!dropping) {
      setDropState(null);
    }
  }, [dropping]);

  const cells = grid.map((letter) =>
    letter ? { ch: letter, state: 'filled' } : null
  );

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        ref={anchorRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 32,
          height: 32,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
      <div className="rd-ambient-demo" aria-hidden="true">
        <Board cells={cells} highlightSet={highlight} boardRef={gridRef} />
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
