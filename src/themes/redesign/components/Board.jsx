import { GRID_COLS } from '../../../utils/gameConstants.js';
import Cell from '../../classic/components/Grid/Cell.jsx';

function Board({ cells = [], highlightSet = null, onColumnClick, boardRef, children }) {
  return (
    <div ref={boardRef} className="game-grid visible">
      {cells.map((cell, i) => {
        const stateOverride = highlightSet?.has(i) ? 'match' : cell?.state;
        const column = i % GRID_COLS;

        return (
          <div key={i} style={{ position: 'relative' }}>
            {/* Invisible touch shield — never animates or remounts */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10,
                cursor: onColumnClick ? 'pointer' : 'default',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
              onClick={() => onColumnClick?.(column)}
            />
            <Cell
              letter={cell?.ch ?? null}
              index={i}
              isMatched={stateOverride === 'match'}
              isPending={stateOverride === 'pending'}
              pendingDirections={cell?.pendingDirections ?? []}
              pendingResetCount={cell?.pendingResetCount ?? 0}
              isInitial={stateOverride === 'initial'}
            />
          </div>
        );
      })}
      {children}
    </div>
  );
}

export default Board;
