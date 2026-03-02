import React from 'react';

function ScoreBoard({ score = 0, gameStatus = 'IDLE', gameMode = null }) {
  const isPlaying = gameStatus === 'PLAYING' || gameStatus === 'PROCESSING';
  const isClearMode = gameMode === 'clear';

  return (
    <div className={`stat-group ${!isPlaying ? 'description-box' : ''}`}>
      {isPlaying ? (
        <>
          {isClearMode ? (
            <>
              <div className="stat-label">Objective</div>
              <div className="stat-value">Clear the board</div>
            </>
          ) : (
            <>
              <div className="stat-label">Score</div>
              <div className="stat-value">{score}</div>
            </>
          )}
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
