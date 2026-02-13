import React from 'react';
import Cell from './Cell.jsx';

function Board({ grid = Array(100).fill(null), onColumnClick }) {
  const handleCellClick = (index) => {
    const column = index % 10;
    if (onColumnClick) {
      onColumnClick(column);
    }
  };

  return (
    <div className="game-grid">
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
          />
        </div>
      ))}
    </div>
  );
}

export default Board;
