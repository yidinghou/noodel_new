import React from 'react';

function ScoreBoard({ score = 0, gameStatus = 'IDLE' }) {
  const isPlaying = gameStatus === 'PLAYING' || gameStatus === 'PROCESSING';

  return (
    <div className={`stat-group ${!isPlaying ? 'description-box' : ''}`}>
      {isPlaying ? (
        <>
          <div className="stat-label">Score</div>
          <div className="stat-value">{score}</div>
        </>
      ) : (
        <>
          <div className="stat-label">NOODLE</div>
          <div className="stat-value">a word puzzle game</div>
        </>
      )}
    </div>
  );
}

export default ScoreBoard;
