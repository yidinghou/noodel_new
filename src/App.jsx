import React, { useState } from 'react';
import GameLayout from './components/Layout/GameLayout.jsx';

function App() {
  const [isMuted, setIsMuted] = useState(false);

  const handleStart = () => {
    console.log('Start button clicked');
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleColumnClick = (column) => {
    console.log('Column clicked:', column);
  };

  return (
    <GameLayout
      score={0}
      lettersRemaining={100}
      nextLetters={['A', 'B', 'C', 'D', 'E']}
      grid={Array(100).fill(null)}
      madeWords={['TEST', 'WORD']}
      onStart={handleStart}
      onMute={handleMute}
      onColumnClick={handleColumnClick}
      isMuted={isMuted}
      showPreview={true}
    />
  );
}

export default App;
