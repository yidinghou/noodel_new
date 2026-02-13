import { generateLetterSequence } from '../utils/letterUtils.js';
import { findWords } from '../utils/wordUtils.js';
import { calculateWordScore } from '../utils/scoringUtils.js';
import { GRID_SIZE, TOTAL_LETTERS, GRID_COLS, GRID_ROWS } from '../utils/gameConstants.js';

// Game state shape
export const initialState = {
  grid: Array(GRID_SIZE).fill(null), // null or { char: 'A', id: 'tile-1', type: 'filled', isMatched: false }
  score: 0,
  lettersRemaining: TOTAL_LETTERS,
  nextQueue: [], // Array of upcoming letter objects
  status: 'IDLE', // IDLE, PLAYING, GAME_OVER, PROCESSING
  madeWords: []
};

// Game reducer
export function gameReducer(state, action) {
  switch (action.type) {
    case 'START_GAME': {
      const letterSequence = generateLetterSequence(TOTAL_LETTERS);
      return {
        ...state,
        nextQueue: letterSequence,
        lettersRemaining: TOTAL_LETTERS,
        status: 'PLAYING',
        grid: Array(GRID_SIZE).fill(null),
        score: 0,
        madeWords: []
      };
    }

    case 'DROP_LETTER': {
      const { column } = action.payload;
      if (!state.nextQueue.length) return state;

      // Find lowest available position in column (bottom-up)
      let targetIndex = -1;
      for (let row = GRID_ROWS - 1; row >= 0; row--) {
        const index = row * GRID_COLS + column;
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

      // Check for game over (no more letters)
      const newStatus = remainingQueue.length === 0 ? 'GAME_OVER' : state.status;

      return {
        ...state,
        grid: newGrid,
        nextQueue: remainingQueue,
        lettersRemaining: remainingQueue.length,
        status: newStatus
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

    case 'REMOVE_WORDS': {
      const { dictionary } = action.payload;
      if (!dictionary) return state;

      const foundWords = findWords(state.grid, dictionary);
      if (foundWords.length === 0) return state;

      // Remove matched cells and calculate score
      const newGrid = [...state.grid];
      let totalScore = 0;
      const newMadeWords = [...state.madeWords];

      foundWords.forEach(wordData => {
        totalScore += calculateWordScore(wordData.word);
        newMadeWords.unshift(wordData.word);
        wordData.indices.forEach(index => {
          newGrid[index] = null;
        });
      });

      return {
        ...state,
        grid: newGrid,
        score: state.score + totalScore,
        madeWords: newMadeWords.slice(0, 20), // Keep last 20 words
        status: 'PLAYING'
      };
    }

    case 'APPLY_GRAVITY': {
      const newGrid = Array(GRID_SIZE).fill(null);

      // Apply gravity column by column
      for (let col = 0; col < GRID_COLS; col++) {
        const columnCells = [];

        // Collect non-null cells from this column
        for (let row = 0; row < GRID_ROWS; row++) {
          const index = row * GRID_COLS + col;
          if (state.grid[index]) {
            columnCells.push(state.grid[index]);
          }
        }

        // Place them at the bottom
        for (let i = 0; i < columnCells.length; i++) {
          const row = GRID_ROWS - columnCells.length + i;
          const index = row * GRID_COLS + col;
          newGrid[index] = columnCells[i];
        }
      }

      return { ...state, grid: newGrid };
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
