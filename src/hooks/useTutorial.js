import { useState, useEffect, useRef } from 'react';
import { GRID_COLS } from '../utils/gameConstants.js';

const TUTORIAL_STATES = {
  DESCRIBE: {
    message: 'NOODEL is a word-making game. Drop letters to form words and they disappear!',
    userCanDrop: false,
    dimElements: {
      card: true,
      grid: true,
      preview: true,
      madeWords: true,
    },
  },
  PREVIEW_INTRO: {
    message: 'Here are your upcoming letters.',
    userCanDrop: false,
    dimElements: {
      card: true,
      madeWords: true,
    },
  },
  COLUMN: {
    userCanDrop: true,
    dimElements: {
      card: true,
      madeWords: true,
    },
  },
  TRY_WORD: {
    message: 'Can you find a way to make a "WORD"?',
    userCanDrop: true,
    dimElements: {
      card: true,
      madeWords: true,
    },
  },
  COMPLETE: {
    message: 'You made a WORD! Tutorial complete!',
    userCanDrop: false,
  },
};

const TUTORIAL_SEQUENCE = ['DESCRIBE', 'PREVIEW_INTRO', 'COLUMN', 'TRY_WORD', 'COMPLETE'];

export function useTutorial(state, dispatch, onComplete = () => {}) {
  const [tutorialState, setTutorialState] = useState(null);
  const [columnIndex, setColumnIndex] = useState(0);

  // Always-current reference to game state — used inside timeouts to avoid stale closures
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  // Per-step grid snapshots for back navigation
  const snapshotsRef = useRef({});
  // Guard against duplicate completion triggers within the same step
  const completionTriggeredRef = useRef(false);
  // Track the completion timeout so we can cancel it when a new game starts
  const completionTimeoutRef = useRef(null);

  const currentConfig = tutorialState ? TUTORIAL_STATES[tutorialState] : null;

  const tutorialMessage = tutorialState === 'COLUMN'
    ? 'Click the grid to place tiles in that column, they drop to the bottom.'
    : currentConfig?.message ?? null;

  // Helper to check if a letter is on the board
  const hasLetterOnBoard = (char) => {
    return state.grid.some(tile => tile && tile.char === char);
  };

  // For TRY_WORD, determine which column to highlight based on what's placed
  let tryWordHighlightColumn = null;
  if (tutorialState === 'TRY_WORD') {
    if (!hasLetterOnBoard('O')) {
      tryWordHighlightColumn = 1;
    } else if (!hasLetterOnBoard('R')) {
      tryWordHighlightColumn = 2;
    } else if (!hasLetterOnBoard('D')) {
      tryWordHighlightColumn = 3;
    }
  }

  const highlightColumn = tutorialState === 'COLUMN'
    ? columnIndex
    : tutorialState === 'TRY_WORD'
    ? tryWordHighlightColumn
    : currentConfig?.highlightColumn ?? null;

  // Save snapshot when entering each step (overwrites on re-entry to stay fresh)
  useEffect(() => {
    if (!tutorialState) return;
    const key = tutorialState === 'COLUMN' ? `COLUMN_${columnIndex}` : tutorialState;
    const { grid, nextQueue, lettersRemaining, madeWords } = stateRef.current;
    snapshotsRef.current[key] = {
      grid: [...grid],
      nextQueue: [...nextQueue],
      lettersRemaining,
      madeWords: [...madeWords],
    };
  }, [tutorialState, columnIndex]);

  // Auto-advance to TRY_WORD when user drops W during COLUMN step
  useEffect(() => {
    if (tutorialState !== 'COLUMN') return;
    const columnHasLetter = state.grid.some(
      (tile, i) => i % GRID_COLS === 0 && tile
    );
    if (columnHasLetter) {
      setTimeout(() => setTutorialState('TRY_WORD'), 600);
    }
  }, [state.grid, tutorialState]);

  // Check if WORD was formed during TRY_WORD
  useEffect(() => {
    if (tutorialState !== 'TRY_WORD') {
      completionTriggeredRef.current = false;
      return;
    }

    // Success: WORD was scored — complete the tutorial
    if (state.madeWords.some(word => word === 'WORD')) {
      if (completionTriggeredRef.current) return;
      completionTriggeredRef.current = true;

      setTutorialState('COMPLETE');
      const timerId = setTimeout(() => {
        setTutorialState(null);
        setColumnIndex(0);
        dispatch({ type: 'RESET' });
        onComplete();
        completionTimeoutRef.current = null;
      }, 2500);
      completionTimeoutRef.current = timerId;
      return;
    }

    // Wait until all WORD letters have been placed on the board
    const allPlaced = ['W', 'O', 'R', 'D'].every(
      char => state.grid.some(tile => tile && tile.char === char)
    );
    if (!allPlaced) return;

    // All letters are on the board but WORD hasn't been scored yet.
    // Give the word-detection pipeline time to run:
    //   grace period (1000ms) + shake (400ms) + gravity (150ms) + buffer
    const timerId = setTimeout(() => {
      // Re-read latest state via ref (not stale closure)
      if (stateRef.current.madeWords.some(word => word === 'WORD')) return;

      // WORD wasn't formed — reset to let user try again
      const snapshot = snapshotsRef.current['TRY_WORD'];
      if (snapshot) {
        dispatch({ type: 'RESTORE_STATE', payload: snapshot });
      }
    }, 1800);

    return () => clearTimeout(timerId);
  }, [state.grid, state.madeWords, tutorialState, dispatch, onComplete]);

  const startTutorial = () => {
    setTutorialState('DESCRIBE');
  };

  const clearTutorial = () => {
    setTutorialState(null);
    setColumnIndex(0);
    snapshotsRef.current = {};
    // Cancel any pending completion cleanup timeout
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }
  };

  // Clean up timeout on unmount or when game state changes
  useEffect(() => {
    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  // Cancel completion timeout when a new game starts
  useEffect(() => {
    if (state.status === 'PLAYING' && state.gameMode && tutorialState === null && completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }
  }, [state.gameMode, state.status, tutorialState]);

  const handleTutorialNext = () => {
    const currentIndex = TUTORIAL_SEQUENCE.indexOf(tutorialState);
    if (currentIndex >= 0 && currentIndex < TUTORIAL_SEQUENCE.length - 1) {
      setTimeout(() => {
        setTutorialState(TUTORIAL_SEQUENCE[currentIndex + 1]);
      }, 600);
    }
  };

  const handleBack = () => {
    const restoreAndGo = (step, colIdx = 0) => {
      const key = step === 'COLUMN' ? `COLUMN_${colIdx}` : step;
      const snap = snapshotsRef.current[key];
      if (snap) dispatch({ type: 'RESTORE_STATE', payload: snap });
      setTutorialState(step);
      setColumnIndex(colIdx);
    };

    if (tutorialState === 'PREVIEW_INTRO') {
      restoreAndGo('DESCRIBE');
    } else if (tutorialState === 'COLUMN') {
      restoreAndGo('PREVIEW_INTRO');
    } else if (tutorialState === 'TRY_WORD') {
      restoreAndGo('COLUMN', 0);
    }
  };

  const canDrop = tutorialState !== null
    ? (currentConfig?.userCanDrop || false) && (state.status === 'PLAYING' || state.status === 'PROCESSING')
    : (state.status === 'PLAYING' || state.status === 'PROCESSING');

  const showNextButton = tutorialState !== null && (
    ['DESCRIBE', 'PREVIEW_INTRO'].includes(tutorialState)
  );
  const showBackButton = tutorialState !== null && !['DESCRIBE', 'COMPLETE'].includes(tutorialState);
  const dimElements = currentConfig?.dimElements || {};
  const highlightPreview = tutorialState === 'PREVIEW_INTRO';

  return {
    tutorialStep: tutorialState,
    tutorialMessage,
    canDrop,
    showNextButton,
    showBackButton,
    dimElements,
    highlightPreview,
    highlightColumn,
    startTutorial,
    clearTutorial,
    handleTutorialNext,
    handleBack,
  };
}
