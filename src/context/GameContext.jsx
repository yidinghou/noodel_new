import React, { createContext, useReducer, useContext, useCallback, useEffect, useRef } from 'react';
import { gameReducer, initialState } from './GameReducer.js';
import { generateLetterSequence } from '../utils/letterUtils.js';
import { generateClearModeGrid } from '../utils/clearModeUtils.js';
import { createSeededRng, getDailyDateSeed, getLocalDateString } from '../utils/seededRandom.js';
import { markDailyPlayed, consumeUnlimitedPlay } from '../utils/playLimits.js';
import { TOTAL_LETTERS, STATUS } from '../utils/gameConstants.js';
import { A } from '../utils/actionTypes.js';
import { createRecorder } from '../services/sessionRecorder.js';
import * as sessionStorage from '../services/sessionStorage.js';

const GameContext = createContext(null);

function buildInitialQueue(mode, rng) {
  let seq = generateLetterSequence(TOTAL_LETTERS, rng);
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

function buildInitialGrid(mode, rng) {
  if (mode === 'clear') return generateClearModeGrid(rng);
  return { grid: null, initialBlocks: [] };
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const scoreSubmittedRef = useRef(false);
  const recorderRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  if (recorderRef.current === null) {
    recorderRef.current = createRecorder();
    recorderRef.current.onChange(() => {
      const snap = recorderRef.current.snapshot();
      if (snap) sessionStorage.save(snap);
    });
  }

  // Auto-resume on first mount if a mid-game snapshot exists.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    resumedRef.current = true;
    const snap = sessionStorage.load();
    if (!snap || !Array.isArray(snap.checkpoints) || snap.checkpoints.length === 0) return;
    const hasGameOver = Array.isArray(snap.events) && snap.events.some(e => e.type === A.GAME_OVER);
    if (hasGameOver) { sessionStorage.clear(); return; }
    const startEvent = snap.events?.find(e => e.type === A.START_GAME);
    if (startEvent?.payload?.gameType === 'daily') {
      const today = getLocalDateString();
      if (!startEvent.payload.gameDate || startEvent.payload.gameDate !== today) {
        sessionStorage.clear();
        return;
      }
    }
    if (!recorderRef.current.loadSnapshot(snap)) { sessionStorage.clear(); return; }
    const latest = snap.checkpoints[snap.checkpoints.length - 1];
    dispatch({ type: A.LOAD_SAVED_GAME, payload: latest.state });
  }, []);

  const wrappedDispatch = useCallback((action) => {
    if (action.type === A.START_GAME) {
      scoreSubmittedRef.current = false;
      const { mode, gameType } = action.payload;
      const seed = gameType === 'unlimited' ? Date.now() : getDailyDateSeed();
      const rng = createSeededRng(seed);
      const initialQueue = buildInitialQueue(mode, rng);
      const { grid: initialGrid, initialBlocks } = buildInitialGrid(mode, rng);
      if (gameType === 'unlimited') consumeUnlimitedPlay();
      const fullAction = { type: A.START_GAME, payload: { mode, gameType, gameDate: getLocalDateString(), initialQueue, initialGrid, initialBlocks } };
      recorderRef.current.record(fullAction);
      dispatch(fullAction);
      return;
    }

    if (action.type === A.DROP_LETTER) {
      recorderRef.current.recordCheckpoint(stateRef.current);
    }

    if (action.type === A.RESET) {
      const isGameInProgress =
        stateRef.current.status !== STATUS.GAME_OVER &&
        stateRef.current.status !== STATUS.IDLE;
      if (isGameInProgress) {
        // Capture current visible state so resume restores here, not pre-last-drop.
        // Skip if PROCESSING (mid-animation) to avoid persisting a partially-animated grid.
        if (stateRef.current.status === STATUS.PLAYING) {
          recorderRef.current.recordCheckpoint(stateRef.current);
        }
        // onChange fires → sessionStorage.save automatically
      } else {
        recorderRef.current.reset();
        sessionStorage.clear();
      }
      dispatch(action);
      return;
    }

    recorderRef.current.record(action);
    dispatch(action);
  }, [dispatch]);

  const undo = useCallback(() => {
    const cp = recorderRef.current.popLastCheckpoint();
    if (!cp) return false;
    dispatch({ type: A.LOAD_SAVED_GAME, payload: cp.state });
    return true;
  }, [dispatch]);

  const resumeSession = useCallback(() => {
    const snap = sessionStorage.load();
    if (!snap?.checkpoints?.length) return;
    const hasGameOver = snap.events?.some(e => e.type === A.GAME_OVER);
    if (hasGameOver) { sessionStorage.clear(); return; }
    if (!recorderRef.current.loadSnapshot(snap)) { sessionStorage.clear(); return; }
    const latest = snap.checkpoints[snap.checkpoints.length - 1];
    dispatch({ type: A.LOAD_SAVED_GAME, payload: latest.state });
  }, [dispatch]);

  // Submit score when game ends (daily only); always clear the session snapshot.
  useEffect(() => {
    if (state.status !== STATUS.GAME_OVER) return;
    sessionStorage.clear(); // game complete — nothing left to resume
    if (state.gameType === 'daily') markDailyPlayed();
    if (!scoreSubmittedRef.current && state.gameType === 'daily') {
      scoreSubmittedRef.current = true;
      const username = localStorage.getItem('noodel_username') ?? 'anonymous';
      const fullSnapshot = recorderRef.current.snapshot();
      // Strip checkpoints — they're local-only for undo/resume, not needed server-side.
      const sessionData = fullSnapshot
        ? { schemaVersion: fullSnapshot.schemaVersion, startedAt: fullSnapshot.startedAt, events: fullSnapshot.events }
        : null;
      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: state.score, gameMode: state.gameMode, username, sessionData, wordsCleared: state.allWordsThisGame, gameDate: getLocalDateString() }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.wordStats) dispatch({ type: A.SET_WORD_STATS, payload: data.wordStats });
        })
        .catch(() => {}); // don't break the game on DB errors
    }
  }, [state.status]);

  return (
    <GameContext.Provider value={{ state, dispatch: wrappedDispatch, undo, resumeSession }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
}
