import { GRID_SIZE, CLEAR_MODE_INITIAL_FILL_PERCENTAGE } from './gameConstants.js';
import { getWeightedRandomLetter } from './letterUtils.js';

/**
 * Fisher-Yates shuffle to select random grid indices
 * @param {number} total - Total number of indices (GRID_SIZE)
 * @param {number} count - How many to select
 * @returns {Array<number>} Selected indices
 */
function getRandomIndices(total, count) {
  const indices = Array.from({ length: total }, (_, i) => i);

  // Fisher-Yates shuffle
  for (let i = total - 1; i > total - count - 1; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices.slice(total - count);
}

/**
 * Generate grid with initial blocks for Clear mode
 * Approximately 20% of grid cells are pre-filled with random letters
 * @returns {Object} { grid: Array, initialBlocks: Array<number> }
 */
export function generateClearModeGrid() {
  const grid = Array(GRID_SIZE).fill(null);
  const cellsToFill = Math.floor(GRID_SIZE * CLEAR_MODE_INITIAL_FILL_PERCENTAGE);
  const indicesToFill = getRandomIndices(GRID_SIZE, cellsToFill);

  indicesToFill.forEach((index, i) => {
    grid[index] = {
      char: getWeightedRandomLetter(),
      id: `initial-${i}`,
      type: 'filled',
      isMatched: false,
      isPending: false,
      pendingDirections: [],
      pendingResetCount: 0,
      isInitial: true
    };
  });

  return {
    grid,
    initialBlocks: indicesToFill
  };
}
