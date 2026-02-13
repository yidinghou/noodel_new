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
        <Cell
          key={cell?.id || `empty-${index}`}
          letter={cell?.char}
          index={index}
          isMatched={cell?.isMatched}
          onClick={() => handleCellClick(index)}
        />
      ))}
    </div>
  );
}

export default Board;
