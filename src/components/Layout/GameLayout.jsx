import { useRef, useState, useCallback } from 'react';
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
  showPreview = false,
  canDrop = false,
}) {
  const gridRef = useRef(null);
  const nextUpRef = useRef(null);

  // Parallel drop tracking
  const [activeDrops, setActiveDrops] = useState([]);
  // Set of columns that currently have an in-flight drop — blocks duplicate column clicks
  const inFlightColumnsRef = useRef(new Set());
  // Number of currently in-flight drops — used to index into nextLetters for letter assignment
  const inFlightCountRef = useRef(0);

  const getDestRow = useCallback((column) => {
    for (let row = GRID_ROWS - 1; row >= 0; row--) {
      if (!grid[row * GRID_COLS + column]) return row;
    }
    return -1;
  }, [grid]);

  const handleColumnClick = useCallback((column) => {
    if (!canDrop) return;

    // Block a second drop to the same column while one is already in flight
    if (inFlightColumnsRef.current.has(column)) return;

    const fromEl = nextUpRef.current;
    const gridEl = gridRef.current;

    // Which letter does this drop carry? The Nth queued letter where N = in-flight count
    const letterIndex = inFlightCountRef.current;
    if (!nextLetters[letterIndex]) return;

    // Fallback: refs not ready — dispatch immediately with no animation
    if (!fromEl || !gridEl) {
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

    const id = `${Date.now()}-${Math.random()}`;

    inFlightColumnsRef.current.add(column);
    inFlightCountRef.current++;

    setActiveDrops(prev => [...prev, {
      id,
      column,
      letter: nextLetters[letterIndex],
      from: { x: fromRect.left, y: fromRect.top },
      toTop: { x: colLeft, y: gridRect.top },
      toFinal: { x: colLeft, y: gridRect.top + destRow * rowHeight },
      cellSize,
    }]);
  }, [canDrop, nextLetters, getDestRow, onColumnClick]);

  const handleDropComplete = useCallback((id, column) => {
    onColumnClick?.(column);
    inFlightColumnsRef.current.delete(column);
    inFlightCountRef.current--;
    setActiveDrops(prev => prev.filter(d => d.id !== id));
  }, [onColumnClick]);

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

      {/* One overlay per in-flight drop — each animates independently */}
      {activeDrops.map(drop => (
        <DroppingOverlay
          key={drop.id}
          id={drop.id}
          column={drop.column}
          letter={drop.letter}
          from={drop.from}
          toTop={drop.toTop}
          toFinal={drop.toFinal}
          cellSize={drop.cellSize}
          onComplete={handleDropComplete}
        />
      ))}
    </div>
  );
}

export default GameLayout;
