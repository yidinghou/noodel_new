import { useState } from 'react';
import GameLayout from './components/Layout/GameLayout.jsx';
import ModeSelector from './components/Controls/ModeSelector.jsx';
import GameOverOverlay from './components/Overlays/GameOverOverlay.jsx';
import { useGame } from './context/GameContext.jsx';
import { useGameLogic } from './hooks/useGameLogic.js';
import { useTutorial } from './hooks/useTutorial.js';

function App() {
  const { state, dispatch } = useGame();
  const { dictionary, loading: dictLoading } = useGameLogic();
  const [isMuted, setIsMuted] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(true);
  const tutorial = useTutorial(state, dispatch, () => {
    setShowModeSelector(true);
  });

  const handleStart = () => {
    setShowModeSelector(true);
  };

  const handleModeSelect = (mode) => {
    // Don't start game if dictionary isn't loaded yet
    if (!dictionary) {
      return;
    }
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
      {dictionary ? (
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
      ) : (
        <div className="main-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '1.5rem'
        }}>
          Loading dictionary...
        </div>
      )}
      <ModeSelector visible={showModeSelector} onSelectMode={handleModeSelect} />
      {dictLoading && showModeSelector && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px',
          fontSize: '0.9rem',
          zIndex: 1001
        }}>
          Loading dictionary...
        </div>
      )}
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
