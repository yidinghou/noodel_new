/**
 * Grid Utility Functions
 * Pure functions for grid calculations - no DOM or state dependencies
 */

/**
 * Calculate linear index from row and column
 * @param {number} row - Row index (0-based)
 * @param {number} col - Column index (0-based)
 * @param {number} columns - Number of columns in grid
 * @returns {number} Linear index
 */
export function calculateIndex(row, col, columns) {
  return row * columns + col;
}

/**
 * Calculate row and column from linear index
 * @param {number} index - Linear index
 * @param {number} columns - Number of columns in grid
 * @returns {{row: number, col: number}} Row and column
 */
export function calculateRowCol(index, columns) {
  return {
    row: Math.floor(index / columns),
    col: index % columns
  };
}

/**
 * Check if column index is valid
 * @param {number} col - Column index to validate
 * @param {number} columns - Number of columns in grid
 * @returns {boolean} True if valid
 */
export function isValidColumn(col, columns) {
  return !isNaN(col) && col >= 0 && col < columns;
}
