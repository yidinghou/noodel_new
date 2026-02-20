import { generateLetterSequence } from '../utils/letterUtils.js';
import { calculateWordScore } from '../utils/scoringUtils.js';
import { GRID_SIZE, TOTAL_LETTERS, GRID_COLS, GRID_ROWS } from '../utils/gameConstants.js';

// Game state shape
export const initialState = {
  grid: Array(GRID_SIZE).fill(null), // null or { char: 'A', id: 'tile-1', type: 'filled', isMatched: false, isPending: false, pendingDirections: [] }
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
        type: 'filled',
        pendingDirections: []
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

    // Mark specific cells as pending (grace period countdown)
    case 'SET_PENDING': {
      const { indices, direction } = action.payload;
      const newGrid = [...state.grid];
      indices.forEach(index => {
        if (newGrid[index]) {
          const pendingDirections = newGrid[index].pendingDirections || [];
          // Add direction if not already present
          if (!pendingDirections.includes(direction)) {
            pendingDirections.push(direction);
          }
          newGrid[index] = {
            ...newGrid[index],
            isPending: true,
            isMatched: false,
            pendingDirections
          };
        }
      });
      return { ...state, grid: newGrid };
    }

    // Clear pending state from specific cells
    case 'CLEAR_PENDING': {
      const { indices, direction } = action.payload;
      const newGrid = [...state.grid];
      indices.forEach(index => {
        if (newGrid[index]) {
          const pendingDirections = (newGrid[index].pendingDirections || []).filter(d => d !== direction);
          newGrid[index] = {
            ...newGrid[index],
            pendingDirections,
            isPending: pendingDirections.length > 0 // Only pending if directions remain
          };
        }
      });
      return { ...state, grid: newGrid };
    }

    // Mark specific cells as matched (triggers shake animation), pauses word detection
    case 'SET_MATCHED_INDICES': {
      const { indices } = action.payload;
      const newGrid = [...state.grid];
      indices.forEach(index => {
        if (newGrid[index]) {
          newGrid[index] = { ...newGrid[index], isMatched: true, isPending: false, pendingDirections: [] };
        }
      });
      return { ...state, grid: newGrid, status: 'PROCESSING' };
    }

    // Remove specific words from grid and score them
    case 'REMOVE_WORDS': {
      const { wordsToRemove } = action.payload; // Array of { word, indices }
      const newGrid = [...state.grid];
      let totalScore = 0;
      const newMadeWords = [...state.madeWords];

      wordsToRemove.forEach(({ word, indices }) => {
        totalScore += calculateWordScore(word);
        newMadeWords.unshift(word);
        indices.forEach(index => {
          newGrid[index] = null;
        });
      });

      return {
        ...state,
        grid: newGrid,
        score: state.score + totalScore,
        madeWords: newMadeWords.slice(0, 20),
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

        // Place them at the bottom (strip pending/matched state after gravity shift)
        for (let i = 0; i < columnCells.length; i++) {
          const row = GRID_ROWS - columnCells.length + i;
          const index = row * GRID_COLS + col;
          newGrid[index] = { ...columnCells[i], isPending: false, isMatched: false, pendingDirections: [] };
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
