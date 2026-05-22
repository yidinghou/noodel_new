import { useState, useRef, useEffect } from 'react';
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

function ClassicRoot({ dictionary, onHowToPlay, onLogin, onSettings }) {
  const { state, dispatch, undo } = useGame();
  const gridWrapperRef = useRef(null);
  const [, forceRender] = useState(0);
  const [pendingMode, setPendingMode] = useState(null);

  // ModeSelector renders into gridWrapperRef via portal; trigger one re-render
  // after the ref attaches so the auto-show-on-IDLE start menu mounts.
  useEffect(() => { forceRender(1); }, []);

  const showModeSelector = state.status === 'IDLE' || pendingMode !== null;

  const handleModeSelect = (mode) => {
    if (!dictionary) {
      setPendingMode(mode);
      return;
    }
    setPendingMode(null);
    dispatch({ type: 'START_GAME', payload: { mode } });
  };

  const handleRestart = () => {
    setPendingMode(null);
    dispatch({ type: 'RESET' });
  };

  const handleCloseModeSelector = () => {
    // No-op while IDLE — start menu cannot be dismissed; only clears a pending-mode wait.
    setPendingMode(null);
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
        onLogin={onLogin}
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
          onClose={handleCloseModeSelector}
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
