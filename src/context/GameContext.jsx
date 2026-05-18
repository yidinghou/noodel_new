import React, { createContext, useReducer, useContext, useCallback, useEffect, useRef } from 'react';
import { gameReducer, initialState } from './GameReducer.js';
import { useGameSession } from '../hooks/useGameSession.js';
import { replayAll } from '../services/replayEngine.js';
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
  const gameSession = useGameSession();
  const stateRef = useRef(state);
  stateRef.current = state;
  const scoreSubmittedRef = useRef(false);

  const wrappedDispatch = useCallback((action) => {
    if (action.type === 'START_GAME') {
      scoreSubmittedRef.current = false;
      const { mode } = action.payload;
      const initialQueue = buildInitialQueue(mode);
      const { grid: initialGrid, initialBlocks } = buildInitialGrid(mode);

      if (mode !== 'tutorial') {
        gameSession.onGameStart(mode, initialQueue, initialGrid, initialBlocks);
      }

      dispatch({ type: 'START_GAME', payload: { mode, initialQueue, initialGrid, initialBlocks } });
      return;
    }

    if (action.type === 'DROP_LETTER') {
      gameSession.recordDrop(action.payload.column, stateRef.current.nextQueue[0]?.char);
    }

    if (action.type === 'REMOVE_WORDS') {
      const { wordsToRemove, chainId, comboDepth, groupSize } = action.payload;
      gameSession.recordClear(
        wordsToRemove.map(w => ({
          word: w.word,
          indices: w.indices,
          direction: w.direction,
          chainId,
          comboDepth,
          groupSize,
        }))
      );
    }

    if (action.type === 'APPLY_GRAVITY') {
      gameSession.recordGravity();
    }

    if (action.type === 'RESET') {
      gameSession.clearSavedSession();
    }

    dispatch(action);
  }, [dispatch, gameSession]);

  // Mark session complete and save score when game ends.
  useEffect(() => {
    if (state.status === 'GAME_OVER' && !scoreSubmittedRef.current) {
      scoreSubmittedRef.current = true;
      const completedSession = gameSession.onGameOver(state);
      const username = localStorage.getItem('noodel_username') ?? 'anonymous';
      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: state.score, gameMode: state.gameMode, username, sessionData: completedSession }),
      }).catch(() => {}); // fire-and-forget; don't break the game on DB errors
    }
  }, [state.status]);

  const loadSavedGame = useCallback(() => {
    const session = gameSession.getSavedSession();
    if (!session || session.events.length === 0) return false;

    // Use cached checkpoint if it covers all events; otherwise replay from scratch.
    const lastSeq = session.events[session.events.length - 1].seq;
    let payload;
    if (session.checkpoint?.afterEventSeq === lastSeq) {
      payload = gameSession.getLoadPayload();
    } else {
      const derived = replayAll(session);
      payload = {
        grid: derived.grid,
        nextQueue: derived.nextQueue,
        lettersRemaining: derived.lettersRemaining,
        score: derived.score,
        madeWords: derived.madeWords,
        gameMode: session.gameMode,
        initialBlocks: session.initialBlocks,
      };
    }
    if (!payload) return false;
    wrappedDispatch({ type: 'LOAD_SAVED_GAME', payload });
    return true;
  }, [gameSession, wrappedDispatch]);

  const undo = useCallback(() => {
    const session = gameSession.getSavedSession();
    if (!session) return false;

    // Find the index of the last DROP_LETTER event.
    let lastDropIdx = -1;
    for (let i = session.events.length - 1; i >= 0; i--) {
      if (session.events[i].type === 'DROP_LETTER') { lastDropIdx = i; break; }
    }
    if (lastDropIdx <= 0) return false;

    const truncated = { ...session, events: session.events.slice(0, lastDropIdx) };
    const derived = replayAll(truncated);
    const payload = {
      grid: derived.grid,
      nextQueue: derived.nextQueue,
      lettersRemaining: derived.lettersRemaining,
      score: derived.score,
      madeWords: derived.madeWords,
      gameMode: session.gameMode,
      initialBlocks: session.initialBlocks,
    };

    gameSession.replaceSession(truncated);
    wrappedDispatch({ type: 'LOAD_SAVED_GAME', payload });
    return true;
  }, [gameSession, wrappedDispatch]);

  return (
    <GameContext.Provider value={{ state, dispatch: wrappedDispatch, loadSavedGame, undo, gameSession, recordWordIdentified: gameSession.recordWordIdentified }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
}
