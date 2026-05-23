import { useRef, useState, useCallback } from 'react';
import { useGame } from '../../../context/GameContext.jsx';
import { GRID_COLS, GRID_ROWS } from '../../../utils/gameConstants.js';
import { A } from '../../../utils/actionTypes.js';
import Shell from '../components/Shell.jsx';
import Board from '../components/Board.jsx';
import DroppingOverlay from '../../classic/components/Grid/DroppingOverlay.jsx';

function InGame({ onHowToPlay, onLogin, onSettings }) {
  const { state, dispatch } = useGame();

  const boardRef = useRef(null);
  const nextUpRef = useRef(null);
  const inFlightColumnsRef = useRef(new Map());
  const inFlightCountRef = useRef(0);
  const [activeDrops, setActiveDrops] = useState([]);

  const getDestRow = useCallback((column, skip = 0) => {
    let empty = 0;
    for (let row = GRID_ROWS - 1; row >= 0; row--) {
      if (!state.grid[row * GRID_COLS + column]) {
        if (empty === skip) return row;
        empty++;
      }
    }
    return -1;
  }, [state.grid]);

  const handleColumnClick = useCallback((column) => {
    const letterIndex = inFlightCountRef.current;
    const letter = state.nextQueue[letterIndex];
    if (!letter) return;

    const cif = inFlightColumnsRef.current.get(column) ?? 0;
    const destRow = getDestRow(column, cif);
    if (destRow === -1) return;

    const fromEl = nextUpRef.current;
    const gridEl = boardRef.current;
    if (!fromEl || !gridEl) {
      dispatch({ type: A.DROP_LETTER, payload: { column } });
      return;
    }

    const fromRect = fromEl.getBoundingClientRect();
    const gridRect = gridEl.getBoundingClientRect();
    const colWidth = gridRect.width / GRID_COLS;
    const rowHeight = gridRect.height / GRID_ROWS;
    const cellSize = Math.min(colWidth, rowHeight);
    const colLeft = gridRect.left + column * colWidth + (colWidth - cellSize) / 2;

    const id = `${Date.now()}-${Math.random()}`;
    inFlightColumnsRef.current.set(column, cif + 1);
    inFlightCountRef.current++;

    setActiveDrops(prev => [...prev, {
      id,
      column,
      letter: letter.char,
      from:    { x: fromRect.left, y: fromRect.top },
      toTop:   { x: colLeft, y: gridRect.top },
      toFinal: { x: colLeft, y: gridRect.top + destRow * rowHeight },
      cellSize,
    }]);
  }, [state.nextQueue, getDestRow, dispatch]);

  const handleDropComplete = useCallback((id, column) => {
    dispatch({ type: A.DROP_LETTER, payload: { column } });
    const remaining = (inFlightColumnsRef.current.get(column) ?? 1) - 1;
    if (remaining === 0) inFlightColumnsRef.current.delete(column);
    else inFlightColumnsRef.current.set(column, remaining);
    inFlightCountRef.current--;
    setActiveDrops(prev => prev.filter(d => d.id !== id));
  }, [dispatch]);

  const cells = state.grid.map(cell => {
    if (!cell) return null;
    let s = 'filled';
    if (cell.isMatched) s = 'match';
    else if (cell.isPending) s = 'pending';
    else if (cell.isInitial) s = 'initial';
    return {
      ch: cell.char,
      id: cell.id,
      state: s,
      pendingDirections: cell.pendingDirections ?? [],
    };
  });

  // Preview queue skips letters already in-flight so the visible "next up" reflects what'll actually drop next
  const next = state.nextQueue
    .slice(activeDrops.length, activeDrops.length + 5)
    .map(l => l.char);

  return (
    <div className="rd-screen rd-ingame">
      <Shell
        score={state.score}
        lettersLeft={state.lettersRemaining}
        next={next}
        madeWords={state.madeWords}
        nextUpRef={nextUpRef}
        onHowToPlay={onHowToPlay}
        onLogin={onLogin}
        onSettings={onSettings}
      >
        <section className="rd-board-wrapper">
          <div className="rd-board-center">
            <Board cells={cells} onColumnClick={handleColumnClick} boardRef={boardRef} />
          </div>
        </section>
      </Shell>

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

export default InGame;
