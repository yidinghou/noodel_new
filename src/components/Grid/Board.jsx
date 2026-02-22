import React from 'react';
import Cell from './Cell.jsx';
import { GRID_SIZE, GRID_COLS } from '../../utils/gameConstants.js';

function Board({ grid = Array(GRID_SIZE).fill(null), onColumnClick, gridRef, highlightColumn = null }) {
  const handleCellClick = (index) => {
    const column = index % GRID_COLS;
    if (onColumnClick) {
      onColumnClick(column);
    }
  };

  return (
    <div ref={gridRef} className="game-grid visible">
      {grid.map((cell, index) => {
        const column = index % GRID_COLS;
        const isHighlighted = highlightColumn !== null && column === highlightColumn;
        return (
        <div key={`cell-${index}`} className={isHighlighted ? 'tutorial-highlight-cell' : undefined} style={{ position: 'relative' }}>
          {/* Invisible touch shield — never animates or remounts */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
              cursor: 'pointer',
            }}
            onClick={() => handleCellClick(index)}
          />
          {/* Animated cell underneath */}
          <Cell
            letter={cell?.char}
            index={index}
            isMatched={cell?.isMatched}
            isPending={cell?.isPending}
            pendingDirections={cell?.pendingDirections || []}
            pendingResetCount={cell?.pendingResetCount || 0}
            isInitial={cell?.isInitial || false}
          />
        </div>
        );
      })}
    </div>
  );
}

export default Board;
