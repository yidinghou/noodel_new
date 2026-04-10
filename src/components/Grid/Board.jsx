import React from 'react';
import Cell from './Cell.jsx';
import { GRID_SIZE, GRID_COLS } from '../../utils/gameConstants.js';

function Board({ grid = Array(GRID_SIZE).fill(null), onColumnClick, gridRef, visible = true }) {
  const handleCellClick = (index) => {
    const column = index % GRID_COLS;
    if (onColumnClick) {
      onColumnClick(column);
    }
  };

  return (
    <div ref={gridRef} className={`game-grid ${visible ? 'visible' : ''}`}>
      {grid.map((cell, index) => {
        const column = index % GRID_COLS;
        return (
        <div key={`cell-${index}`} style={{ position: 'relative' }}>
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
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
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
