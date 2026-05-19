import React, { createContext, useReducer, useContext, useCallback, useEffect, useRef } from 'react';
import { gameReducer, initialState } from './GameReducer.js';
import { generateLetterSequence } from '../utils/letterUtils.js';
import { generateClearModeGrid } from '../utils/clearModeUtils.js';
import { TOTAL_LETTERS } from '../utils/gameConstants.js';

const GameContext = createContext(null);

function buildInitialQueue(mode) {
  let seq = generateLetterSequence(TOTAL_LETTERS);
  if (mode === 'tutorial') {
    seq = [
      { char: 'W', id: 'tutorial-W-1' },
      { char: 'O', id: 'tutorial-O-1' },
      { char: 'R', id: 'tutorial-R-1' },
      { char: 'D', id: 'tutorial-D-1' },
      { char: 'S', id: 'tutorial-S-1' },
      { char: 'W', id: 'tutorial-W-2' },
      { char: 'O', id: 'tutorial-O-2' },
      { char: 'R', id: 'tutorial-R-2' },
      { char: 'D', id: 'tutorial-D-2' },
      { char: 'S', id: 'tutorial-S-2' },
      ...seq.slice(10),
    ];
  }
  return seq;
}

function buildInitialGrid(mode) {
  if (mode === 'clear') return generateClearModeGrid();
  return { grid: null, initialBlocks: [] };
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const scoreSubmittedRef = useRef(false);

  const wrappedDispatch = useCallback((action) => {
    if (action.type === 'START_GAME') {
      scoreSubmittedRef.current = false;
      const { mode } = action.payload;
      const initialQueue = buildInitialQueue(mode);
      const { grid: initialGrid, initialBlocks } = buildInitialGrid(mode);
      dispatch({ type: 'START_GAME', payload: { mode, initialQueue, initialGrid, initialBlocks } });
      return;
    }

    dispatch(action);
  }, [dispatch]);

  // Submit score when game ends.
  useEffect(() => {
    if (state.status === 'GAME_OVER' && !scoreSubmittedRef.current) {
      scoreSubmittedRef.current = true;
      const username = localStorage.getItem('noodel_username') ?? 'anonymous';
      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: state.score, gameMode: state.gameMode, username }),
      }).catch(() => {}); // fire-and-forget; don't break the game on DB errors
    }
  }, [state.status]);

  return (
    <GameContext.Provider value={{ state, dispatch: wrappedDispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
}
