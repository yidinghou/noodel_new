import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import GameLayout from './components/Layout/GameLayout.jsx';
import ModeSelector from './components/Controls/ModeSelector.jsx';
import SettingsMenu from '../components/Controls/SettingsMenu.jsx';
import GameOverOverlay from '../components/Overlays/GameOverOverlay.jsx';
import ReplayOverlay from '../components/Overlays/ReplayOverlay.jsx';
import HowToPlayModal from './HowToPlayModal.jsx';
import { useGame } from '../context/GameContext.jsx';
import { useGameLogic } from '../hooks/useGameLogic.js';
import { hasSavedSession } from '../services/sessionStorage.js';

function App() {
  const { state, dispatch, loadSavedGame, undo, gameSession } = useGame();
  const { dictionary, loading: dictLoading } = useGameLogic();
  const gridWrapperRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showReplayOverlay, setShowReplayOverlay] = useState(false);
  const [showHTP, setShowHTP] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  // Check for saved game on mount
  useEffect(() => {
    setHasSavedGame(hasSavedSession());
  }, []);

  const handleStart = () => {
    setShowModeSelector(true);
  };

  const startMode = (mode) => {
    setShowModeSelector(false);
    gameSession.clearSavedSession();
    setHasSavedGame(false);
    dispatch({ type: 'START_GAME', payload: { mode } });
  };

  const handleResumeGame = () => {
    const resumed = loadSavedGame();
    if (resumed) {
      setShowModeSelector(false);
      setHasSavedGame(false);
    }
  };

  const handleModeSelect = (mode) => {
    if (!dictionary) {
      setPendingMode(mode);
      return;
    }
    startMode(mode);
  };

  const handleReplayGame = () => {
    setShowSettingsMenu(false);
    setShowReplayOverlay(true);
  };

  const handleRestart = () => {
    dispatch({ type: 'RESET' });
    setShowModeSelector(true);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleColumnClick = (column) => {
    if (state.status === 'PLAYING' || state.status === 'PROCESSING') {
      dispatch({ type: 'DROP_LETTER', payload: { column } });
    }
  };

  // Pass enough letters to cover max in-flight drops (7 cols) + 5 visible in preview
  const nextLetters = state.nextQueue.slice(0, 12).map(item => item.char);

  // Check if board was cleared in clear mode
  const isClearMode = state.gameMode === 'clear';
  const boardCleared = isClearMode && state.initialBlocks.length > 0
    ? state.initialBlocks.every(index => !state.grid[index])
    : false;

  return (
    <div className={`app-root${(showModeSelector || showSettingsMenu) ? ' menu-open' : ''}`}>
      <GameLayout
        gridWrapperRef={gridWrapperRef}
        lettersRemaining={state.lettersRemaining}
        nextLetters={nextLetters}
        grid={state.grid}
        madeWords={state.madeWords}
        dictionary={dictionary}
        onStart={handleStart}
        onSettings={() => setShowSettingsMenu(true)}
        onHowToPlay={() => setShowHTP(true)}
        onColumnClick={handleColumnClick}
        onUndo={undo}
        showPreview={state.status === 'PLAYING' || state.status === 'PROCESSING'}
        canDrop={state.status === 'PLAYING' || state.status === 'PROCESSING'}
      />
      {gridWrapperRef.current && createPortal(
        <ModeSelector
          visible={showModeSelector}
          onSelectMode={handleModeSelect}
          onClose={() => setShowModeSelector(false)}
          pendingMode={pendingMode}
          dictLoading={dictLoading}
          dictReady={!!dictionary}
          hasSavedGame={hasSavedGame}
          onResume={handleResumeGame}
        />,
        gridWrapperRef.current
      )}
      {gridWrapperRef.current && createPortal(
        <SettingsMenu
          visible={showSettingsMenu}
          onClose={() => setShowSettingsMenu(false)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          hasGameSession={!!gameSession.getSavedSession()}
          onReplay={handleReplayGame}
        />,
        gridWrapperRef.current
      )}
      {gridWrapperRef.current && createPortal(
        <ReplayOverlay
          visible={showReplayOverlay}
          onClose={() => setShowReplayOverlay(false)}
          session={gameSession.getSavedSession()}
        />,
        gridWrapperRef.current
      )}
      <GameOverOverlay
        visible={state.status === 'GAME_OVER'}
        gameMode={state.gameMode}
        score={state.score}
        lettersRemaining={state.lettersRemaining}
        boardCleared={boardCleared}
        onRestart={handleRestart}
      />
      {showHTP && <HowToPlayModal onClose={() => setShowHTP(false)} />}
    </div>
  );
}

export default App;
