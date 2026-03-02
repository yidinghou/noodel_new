import React, { createContext, useReducer, useContext, useCallback, useEffect, useRef } from 'react';
import { gameReducer, initialState } from './GameReducer.js';
import { useGameSession } from '../hooks/useGameSession.js';
import { buildLoadPayload } from '../services/gameSession.js';
import { generateLetterSequence } from '../utils/letterUtils.js';
import { generateClearModeGrid } from '../utils/clearModeUtils.js';
import { TOTAL_LETTERS } from '../utils/gameConstants.js';

const GameContext = createContext(null);

/**
 * Generate the initial letter queue for a given game mode.
 * Includes tutorial override for seeded letters.
 */
function buildInitialQueue(mode) {
  let letterSequence = generateLetterSequence(TOTAL_LETTERS);

  if (mode === 'tutorial') {
    letterSequence = [
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
      ...letterSequence.slice(10)
    ];
  }

  return letterSequence;
}

/**
 * Generate the initial grid for a given game mode.
 * Returns { grid, initialBlocks }.
 */
function buildInitialGrid(mode) {
  if (mode === 'clear') {
    return generateClearModeGrid();
  }
  return { grid: null, initialBlocks: [] };
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const gameSession = useGameSession();
  const prevStatusRef = useRef(state.status);

  /**
   * Wrap dispatch to intercept game-affecting actions for session recording.
   */
  const wrappedDispatch = useCallback((action) => {
    if (action.type === 'START_GAME') {
      const { mode } = action.payload;
      const initialQueue = buildInitialQueue(mode);
      const { grid: initialGrid, initialBlocks } = buildInitialGrid(mode);

      // Only record tutorial-less games
      if (mode !== 'tutorial') {
        gameSession.onGameStart(mode, initialQueue, initialGrid, initialBlocks);
      }

      dispatch({
        type: 'START_GAME',
        payload: { mode, initialQueue, initialGrid, initialBlocks }
      });
      return;
    }

    if (action.type === 'DROP_LETTER') {
      gameSession.recordDropEvent(action.payload.column);
    }

    if (action.type === 'RESET') {
      gameSession.clearSavedSession();
    }

    dispatch(action);
  }, [dispatch, gameSession]);

  /**
   * Watch for stable game state transitions and capture snapshots.
   * Snapshots are taken after:
   * - APPLY_GRAVITY completes (status: PROCESSING -> PLAYING)
   * - DROP_LETTER with no words formed (stays PLAYING, no pending tiles)
   * - GAME_OVER
   */
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = state.status;

    if (state.status === 'PLAYING') {
      if (prev === 'PROCESSING') {
        // APPLY_GRAVITY just completed - grid is now stable
        gameSession.onStableState(state);
      } else if (prev === 'PLAYING') {
        // DROP_LETTER that didn't form words - check if truly stable
        const hasPending = state.grid.some(t => t?.isPending);
        if (!hasPending) {
          gameSession.onStableState(state);
        }
      }
    } else if (state.status === 'GAME_OVER') {
      gameSession.onStableState(state);
    }
  }, [state.status, state.grid, gameSession]);

  /**
   * Load a previously saved game from localStorage.
   */
  const loadSavedGame = useCallback(() => {
    const session = gameSession.getSavedSession();
    if (!session) return false;
    const payload = buildLoadPayload(session);
    if (!payload) return false;
    wrappedDispatch({ type: 'LOAD_SAVED_GAME', payload });
    return true;
  }, [gameSession, wrappedDispatch]);

  /**
   * Undo to the previous snapshot.
   */
  const undo = useCallback(() => {
    const undoPayload = gameSession.getUndo();
    if (!undoPayload) return false;
    gameSession.performUndo();
    wrappedDispatch({ type: 'LOAD_SAVED_GAME', payload: undoPayload });
    return true;
  }, [gameSession, wrappedDispatch]);

  return (
    <GameContext.Provider value={{ state, dispatch: wrappedDispatch, loadSavedGame, undo, gameSession }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
