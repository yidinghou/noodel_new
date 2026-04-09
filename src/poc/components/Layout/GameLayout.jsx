import { useRef, useState, useCallback, useEffect } from 'react';
import Header from './Header.jsx';
import NextPreview from '../../../components/Controls/NextPreview.jsx';
import Board from '../Grid/Board.jsx';
import MadeWords from '../Stats/MadeWords.jsx';
import DroppingOverlay from '../../../components/Grid/DroppingOverlay.jsx';
import { GRID_COLS, GRID_ROWS } from '../../../utils/gameConstants.js';

function GameLayout({
  gridWrapperRef = null,
  lettersRemaining = 100,
  nextLetters = [],
  grid = [],
  madeWords = [],
  dictionary = null,
  onStart,
  onSettings,
  onHowToPlay,
  onColumnClick,
  onUndo,
  showPreview = false,
  canDrop = false,
}) {
  const gridRef = useRef(null);
  const nextUpRef = useRef(null);

  // Parallel drop tracking
  const [activeDrops, setActiveDrops] = useState([]);
  // Monotonically increases on each click to key-remount the next-up preview letter
  const [shiftKey, setShiftKey] = useState(0);
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
    setShiftKey(k => k + 1);

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
        <Header
          onUndo={onUndo}
          onStart={onStart}
          onSettings={onSettings}
          onHowToPlay={onHowToPlay}
        />
      </div>

      {/* Game Grid Section (Middle) */}
      <div className="game-grid-wrapper" ref={gridWrapperRef}>
        <div className="preview-row">
          <NextPreview nextLetters={nextLetters.slice(activeDrops.length, activeDrops.length + 5)} visible={showPreview} nextUpRef={nextUpRef} shiftKey={shiftKey} />
          <div className={`game-grid-letters-remaining${showPreview ? ' visible' : ''}`}>
            <div className="letters-remaining-label">Letters Remaining</div>
            <div className="letters-remaining-value">{lettersRemaining}</div>
          </div>
        </div>
        <Board grid={grid} onColumnClick={handleColumnClick} gridRef={gridRef} highlightColumn={null} />
      </div>

      {/* Made Words Section (Bottom) */}
      <div className="made-words-section">
        <MadeWords words={madeWords} dictionary={dictionary} />
      </div>

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
