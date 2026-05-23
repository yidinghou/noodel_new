import Board, { CELL, STEP } from './Board.jsx';
import { useAmbientDemo } from '../../../hooks/useAmbientDemo.js';

export { useAmbientDemo };

const DROP_SPEED_CELLS_PER_SEC = 14;

export function AmbientBoard({ grid, dropping, highlight }) {
  const cells = grid.map((letter) =>
    letter ? { ch: letter, state: 'filled' } : null
  );

  let dropStyle = null;
  if (dropping) {
    const { col, destRow: dr, phase } = dropping;
    const left = col * STEP;
    const top = phase === 'top' ? -STEP : dr * STEP;
    const transition = phase === 'falling'
      ? `top ${Math.max(0.12, (dr + 1) / DROP_SPEED_CELLS_PER_SEC)}s linear`
      : 'none';
    dropStyle = { left, top, transition, width: CELL, height: CELL };
  }

  return (
    <div className="rd-ambient-demo" aria-hidden="true">
      <Board cells={cells} highlightSet={highlight}>
        {dropping && (
          <div className="rd-demo-drop" style={dropStyle}>
            {dropping.letter}
          </div>
        )}
      </Board>
    </div>
  );
}

export default function AmbientDemo() {
  const state = useAmbientDemo();
  return <AmbientBoard {...state} />;
}
