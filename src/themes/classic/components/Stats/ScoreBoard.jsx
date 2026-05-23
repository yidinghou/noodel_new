import React from 'react';
import { STATUS } from '../../../../utils/gameConstants.js';

function ScoreBoard({ score = 0, gameStatus = STATUS.IDLE, gameMode = null }) {
  const isPlaying = gameStatus === STATUS.PLAYING || gameStatus === STATUS.PROCESSING;
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
          <div className="stat-label">NOODEL</div>
          <div className="stat-value">a word puzzle game</div>
        </>
      )}
    </div>
  );
}

export default ScoreBoard;
