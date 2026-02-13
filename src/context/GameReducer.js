import { generateLetterSequence } from '../utils/letterUtils.js';
import { findWords } from '../utils/wordUtils.js';
import { calculateWordScore } from '../utils/scoringUtils.js';

// Game state shape
export const initialState = {
  grid: Array(100).fill(null), // null or { char: 'A', id: 'tile-1', type: 'filled', isMatched: false }
  score: 0,
  lettersRemaining: 100,
  nextQueue: [], // Array of upcoming letter objects
  status: 'IDLE', // IDLE, PLAYING, GAME_OVER, PROCESSING
  madeWords: []
};

// Game reducer
export function gameReducer(state, action) {
  switch (action.type) {
    case 'START_GAME': {
      const letterSequence = generateLetterSequence(100);
      return {
        ...state,
        nextQueue: letterSequence,
        lettersRemaining: 100,
        status: 'PLAYING',
        grid: Array(100).fill(null),
        score: 0,
        madeWords: []
      };
    }

    case 'DROP_LETTER': {
      const { column } = action.payload;
      if (!state.nextQueue.length) return state;

      // Find lowest available position in column (bottom-up)
      let targetIndex = -1;
      for (let row = 9; row >= 0; row--) {
        const index = row * 10 + column;
        if (!state.grid[index]) {
          targetIndex = index;
          break;
        }
      }

      // Column is full
      if (targetIndex === -1) return state;

      // Place letter in grid
      const [nextLetter, ...remainingQueue] = state.nextQueue;
      const newGrid = [...state.grid];
      newGrid[targetIndex] = {
        ...nextLetter,
        type: 'filled'
      };

      return {
        ...state,
        grid: newGrid,
        nextQueue: remainingQueue,
        lettersRemaining: remainingQueue.length
      };
    }

    case 'CHECK_WORDS': {
      const { dictionary } = action.payload;
      if (!dictionary) return state;

      const foundWords = findWords(state.grid, dictionary);
      if (foundWords.length === 0) return state;

      // Mark matched cells
      const newGrid = [...state.grid];
      const matchedIndices = new Set();

      foundWords.forEach(wordData => {
        wordData.indices.forEach(index => {
          matchedIndices.add(index);
          if (newGrid[index]) {
            newGrid[index] = { ...newGrid[index], isMatched: true };
          }
        });
      });

      return {
        ...state,
        grid: newGrid,
        status: 'PROCESSING'
      };
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
