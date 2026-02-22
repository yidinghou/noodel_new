import { useRef, useState, useCallback, useEffect } from 'react';
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
  dictionary = null,
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
  // Map<column, count> of in-flight drops per column — used to reserve destination rows
  const inFlightColumnsRef = useRef(new Map());
  // Total in-flight drops — used to index into nextLetters for letter assignment
  const inFlightCountRef = useRef(0);

  // Lock body scroll while any drop is in flight so position:fixed coords stay valid
  useEffect(() => {
    document.body.style.overflow = activeDrops.length > 0 ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [activeDrops.length]);

  // Find the destination row for a drop, skipping the `skipFromBottom` lowest empty rows
  // that are already reserved by in-flight drops to the same column.
  const getDestRow = useCallback((column, skipFromBottom = 0) => {
    let emptyCount = 0;
    for (let row = GRID_ROWS - 1; row >= 0; row--) {
      if (!grid[row * GRID_COLS + column]) {
        if (emptyCount === skipFromBottom) return row;
        emptyCount++;
      }
    }
    return -1;
  }, [grid]);

  const handleColumnClick = useCallback((column) => {
    if (!canDrop) return;

    const fromEl = nextUpRef.current;
    const gridEl = gridRef.current;

    // Which letter does this drop carry? The Nth queued letter where N = total in-flight count
    const letterIndex = inFlightCountRef.current;
    if (!nextLetters[letterIndex]) return;

    // How many drops are already in flight to this specific column?
    // Use that as the row skip so this drop targets the next available row above them.
    const columnInFlight = inFlightColumnsRef.current.get(column) ?? 0;
    const destRow = getDestRow(column, columnInFlight);
    if (destRow === -1) return; // column full (no more empty rows to reserve)

    // Fallback: refs not ready — dispatch immediately with no animation
    if (!fromEl || !gridEl) {
      onColumnClick?.(column);
      return;
    }

    const fromRect = fromEl.getBoundingClientRect();
    const gridRect = gridEl.getBoundingClientRect();
    const colWidth = gridRect.width / GRID_COLS;
    const rowHeight = gridRect.height / GRID_ROWS;
    const cellSize = Math.min(colWidth, rowHeight);
    const colLeft = gridRect.left + column * colWidth + (colWidth - cellSize) / 2;

    const id = `${Date.now()}-${Math.random()}`;

    inFlightColumnsRef.current.set(column, columnInFlight + 1);
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
    const remaining = (inFlightColumnsRef.current.get(column) ?? 1) - 1;
    if (remaining === 0) {
      inFlightColumnsRef.current.delete(column);
    } else {
      inFlightColumnsRef.current.set(column, remaining);
    }
    inFlightCountRef.current--;
    setActiveDrops(prev => prev.filter(d => d.id !== id));
  }, [onColumnClick]);

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
          <NextPreview nextLetters={nextLetters} visible={showPreview} nextUpRef={nextUpRef} />
          <div className={`game-grid-letters-remaining${showPreview ? ' visible' : ''}`}>
            <div className="letters-remaining-label">Letters Remaining</div>
            <div className="letters-remaining-value">{lettersRemaining}</div>
          </div>
        </div>
        <Board grid={grid} onColumnClick={handleColumnClick} gridRef={gridRef} />
      </div>

      {/* Made Words Section (Bottom) */}
      <MadeWords words={madeWords} dictionary={dictionary} />

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
