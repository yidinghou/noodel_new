import { useState } from 'react';
import GameLayout from './components/Layout/GameLayout.jsx';
import ModeSelector from './components/Controls/ModeSelector.jsx';
import GameOverOverlay from './components/Overlays/GameOverOverlay.jsx';
import { useGame } from './context/GameContext.jsx';
import { useGameLogic } from './hooks/useGameLogic.js';
import { useTutorial } from './hooks/useTutorial.js';

function App() {
  const { state, dispatch } = useGame();
  const { dictionary } = useGameLogic();
  const [isMuted, setIsMuted] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const tutorial = useTutorial(state, dispatch, () => {
    setShowModeSelector(true);
  });

  // Show loading state while dictionary loads
  if (!dictionary) {
    return (
      <div className="main-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.5rem'
      }}>
        Loading dictionary...
      </div>
    );
  }

  const handleStart = () => {
    setShowModeSelector(true);
  };

  const handleModeSelect = (mode) => {
    setShowModeSelector(false);
    dispatch({ type: 'START_GAME', payload: { mode } });
    if (mode === 'tutorial') {
      tutorial.startTutorial();
    } else {
      tutorial.clearTutorial();
    }
  };

  const handleRestart = () => {
    tutorial.clearTutorial();
    dispatch({ type: 'RESET' });
    setShowModeSelector(true);
  };

  const handleMute = () => {
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
    <>
      <GameLayout
        score={state.score}
        lettersRemaining={state.lettersRemaining}
        nextLetters={nextLetters}
        grid={state.grid}
        madeWords={state.madeWords}
        dictionary={dictionary}
        onStart={handleStart}
        onMute={handleMute}
        onColumnClick={handleColumnClick}
        isMuted={isMuted}
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
      <ModeSelector visible={showModeSelector} onSelectMode={handleModeSelect} />
      <GameOverOverlay
        visible={state.status === 'GAME_OVER'}
        gameMode={state.gameMode}
        score={state.score}
        onRestart={handleRestart}
      />
    </>
  );
}

export default App;
