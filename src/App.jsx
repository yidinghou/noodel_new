import { useState, useEffect } from 'react';
import GameLayout from './components/Layout/GameLayout.jsx';
import ModeSelector from './components/Controls/ModeSelector.jsx';
import GameOverOverlay from './components/Overlays/GameOverOverlay.jsx';
import { useGame } from './context/GameContext.jsx';
import { useGameLogic } from './hooks/useGameLogic.js';

function App() {
  const { state, dispatch } = useGame();
  const { dictionary } = useGameLogic();
  const [isMuted, setIsMuted] = useState(false);
  const [appPhase, setAppPhase] = useState('intro');

  // Auto-transition from intro to menu phase after animations complete
  useEffect(() => {
    if (appPhase === 'intro') {
      const timer = setTimeout(() => setAppPhase('menu'), 2000);
      return () => clearTimeout(timer);
    }
  }, [appPhase]);

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
    setAppPhase('menu');
  };

  const handleModeSelect = (mode) => {
    setAppPhase('playing');
    dispatch({ type: 'START_GAME', payload: { mode } });
  };

  const handleRestart = () => {
    setAppPhase('menu');
    dispatch({ type: 'RESET' });
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleColumnClick = (column) => {
    if (state.status === 'PLAYING' || state.status === 'PROCESSING') {
      dispatch({ type: 'DROP_LETTER', payload: { column } });
    }
  };

  // Get next 5 letters from queue
  const nextLetters = state.nextQueue.slice(0, 5).map(item => item.char);

  return (
    <div className={`app-wrapper ${appPhase}-state`}>
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
        canDrop={state.status === 'PLAYING' || state.status === 'PROCESSING'}
      />
      <ModeSelector onSelectMode={handleModeSelect} />
      <GameOverOverlay
        visible={state.status === 'GAME_OVER'}
        gameMode={state.gameMode}
        score={state.score}
        onRestart={handleRestart}
      />
    </div>
  );
}

export default App;
