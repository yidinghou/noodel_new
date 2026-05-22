import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import GameLayout from './components/Layout/GameLayout.jsx';
import { DebugOverlay } from './components/Debug/DebugOverlay.jsx';
import ModeSelector from './components/Controls/ModeSelector.jsx';
import GameOverOverlay from './components/Overlays/GameOverOverlay.jsx';
import { useGame } from '../../context/GameContext.jsx';
import './styles/base.css';
import './styles/card.css';
import './styles/grid.css';
import './styles/made-words.css';

function ClassicRoot({ dictionary, onHowToPlay, onSettings }) {
  const { state, dispatch, undo } = useGame();
  const gridWrapperRef = useRef(null);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);

  const handleStart = () => setShowModeSelector(true);

  const startMode = (mode) => {
    setShowModeSelector(false);
    dispatch({ type: 'START_GAME', payload: { mode } });
  };

  const handleModeSelect = (mode) => {
    if (!dictionary) {
      setPendingMode(mode);
      return;
    }
    startMode(mode);
  };

  const handleRestart = () => {
    dispatch({ type: 'RESET' });
    setShowModeSelector(true);
  };

  const handleColumnClick = (column) => {
    if (state.status === 'PLAYING' || state.status === 'PROCESSING') {
      dispatch({ type: 'DROP_LETTER', payload: { column } });
    }
  };

  const nextLetters = state.nextQueue.slice(0, 12).map(item => item.char);

  const isClearMode = state.gameMode === 'clear';
  const boardCleared = isClearMode && state.initialBlocks.length > 0
    ? state.initialBlocks.every(index => !state.grid[index])
    : false;
  const tilesOnBoard = state.grid.filter(Boolean).length;

  return (
    <div className={`app-root${showModeSelector ? ' menu-open' : ''}`}>
      <GameLayout
        gridWrapperRef={gridWrapperRef}
        score={state.score}
        lettersRemaining={state.lettersRemaining}
        nextLetters={nextLetters}
        grid={state.grid}
        madeWords={state.madeWords}
        dictionary={dictionary}
        gameStatus={state.status}
        gameMode={state.gameMode}
        onStart={handleStart}
        onSettings={onSettings}
        onInfo={onHowToPlay}
        onColumnClick={handleColumnClick}
        onUndo={undo}
        showPreview={state.status === 'PLAYING' || state.status === 'PROCESSING'}
      />
      {gridWrapperRef.current && createPortal(
        <ModeSelector
          visible={showModeSelector}
          onSelectMode={handleModeSelect}
          onClose={() => setShowModeSelector(false)}
          pendingMode={pendingMode}
          dictReady={!!dictionary}
        />,
        gridWrapperRef.current
      )}
      <GameOverOverlay
        visible={state.status === 'GAME_OVER'}
        gameMode={state.gameMode}
        score={state.score}
        lettersRemaining={state.lettersRemaining}
        boardCleared={boardCleared}
        tilesOnBoard={tilesOnBoard}
        wordStats={state.wordStats}
        onRestart={handleRestart}
      />
      <DebugOverlay />
    </div>
  );
}

export default ClassicRoot;
