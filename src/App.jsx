import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import GameLayout from './components/Layout/GameLayout.jsx';
import ModeSelector from './components/Controls/ModeSelector.jsx';
import SettingsMenu from './components/Controls/SettingsMenu.jsx';
import GameOverOverlay from './components/Overlays/GameOverOverlay.jsx';
import { useGame } from './context/GameContext.jsx';
import { useGameLogic } from './hooks/useGameLogic.js';
import { useTutorial } from './hooks/useTutorial.js';
import { useIntroSequence } from './hooks/useIntroSequence.js';

function App() {
  const { state, dispatch } = useGame();
  const { dictionary, loading: dictLoading } = useGameLogic();
  const gridWrapperRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);
  const tutorial = useTutorial(state, dispatch, () => {
    setShowModeSelector(true);
  });
  const { dropOrderMap, statsVisible, controlsVisible, boardVisible, fastForward } = useIntroSequence();

  const handleStart = () => {
    setShowModeSelector(true);
  };

  const startMode = (mode) => {
    setShowModeSelector(false);
    dispatch({ type: 'START_GAME', payload: { mode } });
    if (mode === 'tutorial') {
      tutorial.startTutorial();
    } else {
      tutorial.clearTutorial();
    }
  };

  const handleModeSelect = (mode) => {
    if (!dictionary) {
      setPendingMode(mode);
      return;
    }
    startMode(mode);
  };


  const handleRestart = () => {
    tutorial.clearTutorial();
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

  return (
    <div className={`app-root${(showModeSelector || showSettingsMenu) ? ' menu-open' : ''}`}>
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
        dropOrderMap={dropOrderMap}
        statsVisible={statsVisible}
        controlsVisible={controlsVisible}
        boardVisible={boardVisible}
        onFastForward={fastForward}
        onStart={handleStart}
        onSettings={() => setShowSettingsMenu(true)}
        onColumnClick={handleColumnClick}
        showPreview={state.status === 'PLAYING' || state.status === 'PROCESSING'}
        canDrop={tutorial.canDrop}
        tutorialStep={tutorial.tutorialStep}
        tutorialMessage={tutorial.tutorialMessage}
        showNextButton={tutorial.showNextButton}
        showBackButton={tutorial.showBackButton}
        dimElements={tutorial.dimElements}
        highlightPreview={tutorial.highlightPreview}
        highlightColumn={tutorial.highlightColumn}
        onTutorialNext={tutorial.handleTutorialNext}
        onTutorialBack={tutorial.handleBack}
      />
      {gridWrapperRef.current && createPortal(
        <ModeSelector
          visible={showModeSelector}
          onSelectMode={handleModeSelect}
          onClose={() => setShowModeSelector(false)}
          pendingMode={pendingMode}
          dictLoading={dictLoading}
          dictReady={!!dictionary}
        />,
        gridWrapperRef.current
      )}
      {gridWrapperRef.current && createPortal(
        <SettingsMenu
          visible={showSettingsMenu}
          onClose={() => setShowSettingsMenu(false)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />,
        gridWrapperRef.current
      )}
      <GameOverOverlay
        visible={state.status === 'GAME_OVER'}
        gameMode={state.gameMode}
        score={state.score}
        lettersRemaining={state.lettersRemaining}
        onRestart={handleRestart}
      />
    </div>
  );
}

export default App;
