import React, { useState } from 'react';
import GameLayout from './components/Layout/GameLayout.jsx';
import { useGame } from './context/GameContext.jsx';

function App() {
  const { state, dispatch } = useGame();
  const [isMuted, setIsMuted] = useState(false);

  const handleStart = () => {
    dispatch({ type: 'START_GAME' });
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleColumnClick = (column) => {
    if (state.status === 'PLAYING') {
      dispatch({ type: 'DROP_LETTER', payload: { column } });
    }
  };

  // Get next 5 letters from queue
  const nextLetters = state.nextQueue.slice(0, 5).map(item => item.char);

  return (
    <GameLayout
      score={state.score}
      lettersRemaining={state.lettersRemaining}
      nextLetters={nextLetters}
      grid={state.grid}
      madeWords={state.madeWords}
      onStart={handleStart}
      onMute={handleMute}
      onColumnClick={handleColumnClick}
      isMuted={isMuted}
      showPreview={state.status === 'PLAYING'}
    />
  );
}

export default App;
