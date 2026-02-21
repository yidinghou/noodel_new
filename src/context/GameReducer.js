import { generateLetterSequence } from '../utils/letterUtils.js';
import { calculateWordScore } from '../utils/scoringUtils.js';
import { generateClearModeGrid } from '../utils/clearModeUtils.js';
import { GRID_SIZE, TOTAL_LETTERS, GRID_COLS, GRID_ROWS } from '../utils/gameConstants.js';

// Game state shape
export const initialState = {
  grid: Array(GRID_SIZE).fill(null), // null or { char: 'A', id: 'tile-1', type: 'filled', isMatched: false, isPending: false, pendingDirections: [], isInitial: false }
  score: 0,
  lettersRemaining: TOTAL_LETTERS,
  nextQueue: [], // Array of upcoming letter objects
  status: 'IDLE', // IDLE, PLAYING, GAME_OVER, PROCESSING
  madeWords: [],
  gameMode: null, // null, 'classic', or 'clear'
  initialBlocks: [] // Array of indices for Clear mode initial blocks
};

// Game reducer
export function gameReducer(state, action) {
  switch (action.type) {
    case 'START_GAME': {
      const { mode } = action.payload;
      const letterSequence = generateLetterSequence(TOTAL_LETTERS);

      // Generate starting grid based on mode
      let initialGrid = Array(GRID_SIZE).fill(null);
      let initialBlockIndices = [];

      if (mode === 'clear') {
        const clearGridResult = generateClearModeGrid();
        initialGrid = clearGridResult.grid;
        initialBlockIndices = clearGridResult.initialBlocks;
      }

      return {
        ...state,
        nextQueue: letterSequence,
        lettersRemaining: TOTAL_LETTERS,
        status: 'PLAYING',
        grid: initialGrid,
        score: 0,
        madeWords: [],
        gameMode: mode,
        initialBlocks: initialBlockIndices
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
        pendingDirections: [],
        isInitial: false
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
          const isAlreadyPending = pendingDirections.length > 0;
          // Add direction if not already present
          if (!pendingDirections.includes(direction)) {
            pendingDirections.push(direction);
          }
          newGrid[index] = {
            ...newGrid[index],
            isPending: true,
            isMatched: false,
            pendingDirections,
            // Increment reset count to restart animation when timer resets
            pendingResetCount: (newGrid[index].pendingResetCount || 0) + (isAlreadyPending ? 1 : 0)
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
            isPending: pendingDirections.length > 0, // Only pending if directions remain
            pendingResetCount: pendingDirections.length > 0 ? newGrid[index].pendingResetCount : 0
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
          newGrid[index] = {
            ...newGrid[index],
            isMatched: true,
            isPending: false,
            pendingDirections: [],
            pendingResetCount: 0
          };
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
          newGrid[index] = {
            ...columnCells[i],
            isPending: false,
            isMatched: false,
            pendingDirections: [],
            pendingResetCount: 0,
            isInitial: columnCells[i].isInitial || false
          };
        }
      }

      return { ...state, grid: newGrid, status: 'PLAYING' };
    }

    case 'GAME_OVER': {
      return {
        ...state,
        status: 'GAME_OVER'
      };
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
