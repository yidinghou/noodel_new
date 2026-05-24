import { useRef } from 'react';
import GameLayout from './components/Layout/GameLayout.jsx';
import { DebugOverlay } from './components/Debug/DebugOverlay.jsx';
import GameOverOverlay from './components/Overlays/GameOverOverlay.jsx';
import { useGame } from '../../context/GameContext.jsx';
import { STATUS } from '../../utils/gameConstants.js';
import { A } from '../../utils/actionTypes.js';
import './styles/base.css';
import './styles/card.css';
import './styles/grid.css';
import './styles/made-words.css';

function ClassicRoot({ dictionary, onHowToPlay, onLogin, onSettings }) {
  const { state, dispatch, undo } = useGame();
  const gridWrapperRef = useRef(null);

  const handleStart = () => {
    dispatch({ type: A.START_GAME, payload: { mode: 'clear' } });
  };

  const handleRestart = () => {
    dispatch({ type: A.RESET });
  };

  const handleColumnClick = (column) => {
    if (state.status === STATUS.PLAYING || state.status === STATUS.PROCESSING) {
      dispatch({ type: A.DROP_LETTER, payload: { column } });
    }
  };

  const nextLetters = state.nextQueue.slice(0, 12).map(item => item.char);

  const isClearMode = state.gameMode === 'clear';
  const boardCleared = isClearMode && state.initialBlocks.length > 0
    ? state.initialBlocks.every(index => !state.grid[index])
    : false;
  const tilesOnBoard = state.grid.filter(Boolean).length;

  return (
    <div className="app-root">
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
        onStartGame={handleStart}
        showPreview={state.status === STATUS.PLAYING || state.status === STATUS.PROCESSING}
      />
      <GameOverOverlay
        visible={state.status === STATUS.GAME_OVER}
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
