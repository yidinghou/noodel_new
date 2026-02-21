import React from 'react';
import Cell from './Cell.jsx';
import { GRID_SIZE, GRID_COLS } from '../../utils/gameConstants.js';

function Board({ grid = Array(GRID_SIZE).fill(null), onColumnClick, gridRef }) {
  const handleCellClick = (index) => {
    const column = index % GRID_COLS;
    if (onColumnClick) {
      onColumnClick(column);
    }
  };

  return (
    <div ref={gridRef} className="game-grid visible">
      {grid.map((cell, index) => (
        <div
          key={cell?.id || `empty-${index}`}
          onClick={() => handleCellClick(index)}
          style={{ cursor: 'pointer' }}
        >
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
      ))}
    </div>
  );
}

export default Board;
