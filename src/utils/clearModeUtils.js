import { GRID_SIZE, GRID_COLS, GRID_ROWS, CLEAR_MODE_INITIAL_FILL_PERCENTAGE } from './gameConstants.js';
import { getWeightedRandomLetter } from './letterUtils.js';

/**
 * Generate grid with initial blocks for Clear mode
 * Approximately 20% of grid cells are pre-filled with random letters
 * Initial blocks fall to the bottom of their columns (gravity applied)
 * @returns {Object} { grid: Array, initialBlocks: Array<number> }
 */
export function generateClearModeGrid() {
  const grid = Array(GRID_SIZE).fill(null);
  const cellsToFill = Math.floor(GRID_SIZE * CLEAR_MODE_INITIAL_FILL_PERCENTAGE);

  // Generate random letters and place them in random columns
  const initialLetters = Array.from({ length: cellsToFill }, (_, i) => ({
    char: getWeightedRandomLetter(),
    id: `initial-${i}`,
    type: 'filled',
    isMatched: false,
    isPending: false,
    pendingDirections: [],
    pendingResetCount: 0,
    isInitial: true
  }));

  // Randomly distribute letters across columns
  const shuffledLetters = initialLetters.sort(() => Math.random() - 0.5);
  const lettersPerColumn = Array.from({ length: GRID_COLS }, () => []);

  shuffledLetters.forEach(letter => {
    const randomCol = Math.floor(Math.random() * GRID_COLS);
    lettersPerColumn[randomCol].push(letter);
  });

  // Apply gravity: place letters at the bottom of each column
  const initialBlockIndices = [];
  for (let col = 0; col < GRID_COLS; col++) {
    const columnLetters = lettersPerColumn[col];
    const startRow = GRID_ROWS - columnLetters.length;

    columnLetters.forEach((letter, i) => {
      const row = startRow + i;
      const index = row * GRID_COLS + col;
      grid[index] = letter;
      initialBlockIndices.push(index);
    });
  }

  return {
    grid,
    initialBlocks: initialBlockIndices
  };
}
