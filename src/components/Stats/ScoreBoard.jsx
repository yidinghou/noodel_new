import React from 'react';

function ScoreBoard({ score = 0 }) {
  return (
    <div className="stat-group">
      <div className="stat-label">Score</div>
      <div className="stat-value">{score}</div>
    </div>
  );
}

export default ScoreBoard;
