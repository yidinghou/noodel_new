import React, { useRef, useState, useLayoutEffect } from 'react';
import Cell from './Cell.jsx';
import { GRID_SIZE, GRID_COLS, GRID_ROWS } from '../../utils/gameConstants.js';

function Board({ grid = Array(GRID_SIZE).fill(null), onColumnClick }) {
  const gridRef = useRef(null);
  const [cellHeight, setCellHeight] = useState(0);

  useLayoutEffect(() => {
    if (gridRef.current) {
      setCellHeight(gridRef.current.offsetHeight / GRID_ROWS);
    }
  }, []);

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
            cellHeight={cellHeight}
          />
        </div>
      ))}
    </div>
  );
}

export default Board;
