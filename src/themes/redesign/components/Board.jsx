export const COLS = 7;
export const ROWS = 6;
export const CELL = 48;
export const GAP = 4;
export const STEP = CELL + GAP;
export const BOARD_W = COLS * CELL + (COLS - 1) * GAP;
export const BOARD_H = ROWS * CELL + (ROWS - 1) * GAP;

function computePendingShadow(directions) {
  if (!directions || directions.length === 0) return undefined;
  const shadows = [];
  if (directions.includes('horizontal')) {
    shadows.push('inset 3px 0 0 0 #4CAF50', 'inset -3px 0 0 0 #4CAF50');
  }
  if (directions.includes('vertical')) {
    shadows.push('inset 0 3px 0 0 #1976D2', 'inset 0 -3px 0 0 #1976D2');
  }
  return shadows.length ? shadows.join(', ') : undefined;
}

function Board({ cells = [], highlightSet = null, onColumnClick, boardRef, children }) {
  return (
    <div
      ref={boardRef}
      className={`rd-board${onColumnClick ? ' rd-board--interactive' : ''}`}
      style={{
        width: BOARD_W,
        height: BOARD_H,
        gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
        gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
        gap: GAP,
      }}
    >
      {cells.map((cell, i) => {
        const ch = cell?.ch ?? null;
        const stateOverride = highlightSet?.has(i) ? 'match' : cell?.state;
        const dirs = cell?.pendingDirections ?? [];

        const cls = ['rd-cell'];
        if (stateOverride === 'filled')  cls.push('is-filled');
        else if (stateOverride === 'pending') {
          cls.push('is-pending');
          if (dirs.includes('diagonal-down-right')) cls.push('is-pending-diag-dr');
          if (dirs.includes('diagonal-up-right'))   cls.push('is-pending-diag-ur');
        }
        else if (stateOverride === 'match') cls.push('is-match');

        const inlineStyle = { width: CELL, height: CELL };
        if (stateOverride === 'pending') {
          const shadow = computePendingShadow(dirs);
          if (shadow) inlineStyle.boxShadow = shadow;
        }

        return (
          <div
            key={i}
            className={cls.join(' ')}
            style={inlineStyle}
            onClick={() => onColumnClick?.(i % COLS)}
          >
            {ch && (
              <span key={cell?.id ?? `${i}-${ch}`} className="rd-cell__inner">{ch}</span>
            )}
          </div>
        );
      })}
      {children}
    </div>
  );
}

export default Board;
