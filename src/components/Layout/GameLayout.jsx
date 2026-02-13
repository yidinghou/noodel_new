import React from 'react';
import Header from './Header.jsx';
import ScoreBoard from '../Stats/ScoreBoard.jsx';
import Actions from '../Controls/Actions.jsx';
import NextPreview from '../Controls/NextPreview.jsx';
import Board from '../Grid/Board.jsx';
import MadeWords from '../Stats/MadeWords.jsx';

function GameLayout({
  score = 0,
  lettersRemaining = 100,
  nextLetters = [],
  grid = Array(100).fill(null),
  madeWords = [],
  onStart,
  onMute,
  onColumnClick,
  isMuted = false,
  showPreview = false
}) {
  return (
    <div className="main-container">
      {/* Card Section (Top) */}
      <div className="card">
        <Header />
        <div className="stats">
          <ScoreBoard score={score} />
          <Actions onStart={onStart} onMute={onMute} isMuted={isMuted} />
        </div>
      </div>

      {/* Game Grid Section (Middle) */}
      <div className="game-grid-wrapper">
        <div className="preview-row">
          <NextPreview nextLetters={nextLetters} visible={showPreview} />
          <div className="game-grid-letters-remaining">
            <div className="letters-remaining-label">Letters Remaining</div>
            <div className="letters-remaining-value">{lettersRemaining}</div>
          </div>
        </div>
        <Board grid={grid} onColumnClick={onColumnClick} />
      </div>

      {/* Made Words Section (Bottom) */}
      <MadeWords words={madeWords} />
    </div>
  );
}

export default GameLayout;
