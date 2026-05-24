import { useRef, useState, useCallback, useEffect } from 'react';
import Header from './Header.jsx';
import ScoreBoard from '../Stats/ScoreBoard.jsx';
import NextPreview from '../Controls/NextPreview.jsx';
import Board from '../Grid/Board.jsx';
import MadeWords from '../Stats/MadeWords.jsx';
import DroppingOverlay from '../../../../shared/overlays/DroppingOverlay.jsx';
import { HowToPlayIcon, LoginIcon, SettingsIcon } from '../../../../shared/icons/ActionIcons.jsx';
import { GRID_COLS, GRID_ROWS } from '../../../../utils/gameConstants.js';
import { useAmbientDemo } from '../../../../hooks/useAmbientDemo.js';
import StartGameOverlay from '../../../../shared/components/StartGameOverlay.jsx';

function GameLayout({
  gridWrapperRef = null,
  score = 0,
  lettersRemaining = 100,
  nextLetters = [],
  grid = [],
  madeWords = [],
  dictionary = null,
  gameStatus = 'IDLE',
  gameMode = null,
  animateTitle = true,
  onLogin,
  onSettings,
  onInfo,
  onColumnClick,
  onUndo,
  onStartGame,
  showPreview = false,
}) {
  const gridRef = useRef(null);
  const nextUpRef = useRef(null);

  const { grid: ambientGrid, dropping: ambientDrop, highlight: ambientHighlight, queue: ambientQueue } = useAmbientDemo();

  const isIdle = gameStatus === 'IDLE';
  const displayGrid = isIdle
    ? ambientGrid.map((ch, i) => ch ? { char: ch, isMatched: ambientHighlight?.has(i) || false, isPending: false, pendingDirections: [], pendingResetCount: 0, isInitial: false } : null)
    : grid;

  const [ambientDropState, setAmbientDropState] = useState(null);
  useEffect(() => {
    if (!isIdle) { setAmbientDropState(null); return; }
    if (ambientDrop?.phase === 'falling') {
      const fromEl = nextUpRef.current;
      const gridEl = gridRef.current;
      if (!fromEl || !gridEl) return;
      const fromRect = fromEl.getBoundingClientRect();
      const gridRect = gridEl.getBoundingClientRect();
      const colW = gridRect.width / GRID_COLS;
      const rowH = gridRect.height / GRID_ROWS;
      const cellSize = Math.min(colW, rowH);
      const col = ambientDrop.col;
      const dr = ambientDrop.destRow;
      const colLeft = gridRect.left + col * colW + (colW - cellSize) / 2;
      setAmbientDropState({
        id: `ambient-${col}-${dr}-${Date.now()}`,
        letter: ambientDrop.letter,
        from: { x: fromRect.left, y: fromRect.top },
        toTop: { x: colLeft, y: gridRect.top },
        toFinal: { x: colLeft, y: gridRect.top + dr * rowH },
        cellSize,
      });
    } else if (!ambientDrop) {
      setAmbientDropState(null);
    }
  }, [ambientDrop, isIdle]);

  // Parallel drop tracking
  const [activeDrops, setActiveDrops] = useState([]);
  // Monotonically increases on each click to key-remount the next-up preview letter
  const [shiftKey, setShiftKey] = useState(0);
  // Map<column, count> of in-flight drops per column — used to reserve destination rows
  const inFlightColumnsRef = useRef(new Map());
  // Total in-flight drops — used to index into nextLetters for letter assignment
  const inFlightCountRef = useRef(0);

  // Lock body scroll while any drop is in flight so position:fixed coords stay valid
  // Block scroll during drop so position:fixed overlay coords stay valid
  useEffect(() => {
    if (activeDrops.length > 0) {
      document.body.style.overscrollBehavior = 'none';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overscrollBehavior = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overscrollBehavior = '';
      document.body.style.touchAction = '';
    };
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
  }, [nextLetters, getDestRow, onColumnClick]);

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
      {/* App Bar (Top) — info LEFT, login + settings RIGHT */}
      <header className="app-bar">
        <div className="app-bar__side app-bar__side--left">
          <button className="action-btn info-btn" onClick={onInfo} title="How to Play" aria-label="How to Play">
            <HowToPlayIcon />
          </button>
        </div>
        <div className="app-bar__center" />
        <div className="app-bar__side app-bar__side--right">
          <button className="action-btn login-btn" onClick={onLogin} title="Log in" aria-label="Log in">
            <LoginIcon />
          </button>
          <button className="action-btn settings-btn" onClick={onSettings} title="Settings" aria-label="Settings">
            <SettingsIcon />
          </button>
        </div>
      </header>

      {/* Hero (wordmark + compact score) */}
      <div className="hero">
        <Header onUndo={onUndo} animateIn={animateTitle} />
        <ScoreBoard score={score} gameStatus={gameStatus} gameMode={gameMode} />
      </div>

      {/* Game Grid Section (Middle) */}
      <div className={`game-grid-wrapper${isIdle ? ' game-grid-wrapper--idle' : ''}`} ref={gridWrapperRef}>
        <div className="preview-row">
          <NextPreview
            nextLetters={isIdle ? ambientQueue : nextLetters.slice(activeDrops.length, activeDrops.length + 5)}
            visible={isIdle || showPreview}
            nextUpRef={nextUpRef}
            shiftKey={shiftKey}
          />
          <div className={`game-grid-letters-remaining${showPreview ? ' visible' : ''}`}>
            <div className="letters-remaining-label">Letters Remaining</div>
            <div className="letters-remaining-value">{lettersRemaining}</div>
          </div>
        </div>
        <Board grid={displayGrid} onColumnClick={isIdle ? null : handleColumnClick} gridRef={gridRef} visible={true} />
        {gameStatus === 'IDLE' && (
          <StartGameOverlay className="start-game-overlay--classic" onClick={onStartGame} />
        )}
      </div>

      {/* Made Words Section (Bottom) */}
      <div className="made-words-section">
        <MadeWords words={madeWords} dictionary={dictionary} visible={true} />
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
      {ambientDropState && (
        <DroppingOverlay
          key={ambientDropState.id}
          {...ambientDropState}
          className="classic-ambient-dropping"
          opacity={0.4}
          onComplete={() => {}}
        />
      )}
    </div>
  );
}

export default GameLayout;
