import React, { useRef, useState, useCallback } from 'react';
import Header from './Header.jsx';
import ScoreBoard from '../Stats/ScoreBoard.jsx';
import Actions from '../Controls/Actions.jsx';
import NextPreview from '../Controls/NextPreview.jsx';
import Board from '../Grid/Board.jsx';
import MadeWords from '../Stats/MadeWords.jsx';
import DroppingOverlay from '../Grid/DroppingOverlay.jsx';
import { GRID_COLS, GRID_ROWS } from '../../utils/gameConstants.js';

function GameLayout({
  score = 0,
  lettersRemaining = 100,
  nextLetters = [],
  grid = [],
  madeWords = [],
  onStart,
  onMute,
  onColumnClick,
  isMuted = false,
  showPreview = false
}) {
  const gridRef = useRef(null);
  const nextUpRef = useRef(null);
  const [dropState, setDropState] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Find the lowest empty row in a column before dispatching
  const getDestRow = useCallback((column) => {
    for (let row = GRID_ROWS - 1; row >= 0; row--) {
      if (!grid[row * GRID_COLS + column]) return row;
    }
    return -1;
  }, [grid]);

  const handleColumnClick = useCallback((column) => {
    if (isAnimating) return;

    const fromEl = nextUpRef.current;
    const gridEl = gridRef.current;

    // Fallback: refs not ready or no letter queued — dispatch immediately
    if (!fromEl || !gridEl || !nextLetters[0]) {
      onColumnClick?.(column);
      return;
    }

    const destRow = getDestRow(column);
    if (destRow === -1) return; // column full

    const fromRect = fromEl.getBoundingClientRect();
    const gridRect = gridEl.getBoundingClientRect();
    const colWidth = gridRect.width / GRID_COLS;
    const rowHeight = gridRect.height / GRID_ROWS;
    const cellSize = Math.min(colWidth, rowHeight);
    const colLeft = gridRect.left + column * colWidth + (colWidth - cellSize) / 2;

    setDropState({
      id: Date.now(),
      letter: nextLetters[0],
      from: { x: fromRect.left, y: fromRect.top },
      toTop: { x: colLeft, y: gridRect.top },
      toFinal: { x: colLeft, y: gridRect.top + destRow * rowHeight },
      cellSize,
      column,
    });
    setIsAnimating(true);
  }, [isAnimating, nextLetters, getDestRow, onColumnClick]);

  const handleDropComplete = useCallback(() => {
    onColumnClick?.(dropState.column);
    setDropState(null);
    setIsAnimating(false);
  }, [dropState, onColumnClick]);

  return (
    <div className="main-container">
      {/* Card Section (Top) */}
      <div className="card">
        <Header />
        <div className="stats visible">
          <ScoreBoard score={score} />
          <Actions onStart={onStart} onMute={onMute} isMuted={isMuted} />
        </div>
      </div>

      {/* Game Grid Section (Middle) */}
      <div className="game-grid-wrapper">
        <div className="preview-row">
          <NextPreview nextLetters={nextLetters} visible={showPreview} nextUpRef={nextUpRef} />
          <div className="game-grid-letters-remaining">
            <div className="letters-remaining-label">Letters Remaining</div>
            <div className="letters-remaining-value">{lettersRemaining}</div>
          </div>
        </div>
        <Board grid={grid} onColumnClick={handleColumnClick} gridRef={gridRef} />
      </div>

      {/* Made Words Section (Bottom) */}
      <MadeWords words={madeWords} />

      {/* Drop animation overlay — travels from preview tile to destination cell */}
      {dropState && (
        <DroppingOverlay
          key={dropState.id}
          letter={dropState.letter}
          from={dropState.from}
          toTop={dropState.toTop}
          toFinal={dropState.toFinal}
          cellSize={dropState.cellSize}
          onComplete={handleDropComplete}
        />
      )}
    </div>
  );
}

export default GameLayout;
