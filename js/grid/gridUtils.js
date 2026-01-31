/**
 * Grid Utility Functions
 * Pure functions for grid calculations - no DOM or state dependencies
 */

/**
 * Validate that columns parameter is a valid positive integer
 * @param {number} columns - Number of columns to validate
 * @returns {boolean} True if valid
 */
function isValidColumns(columns) {
  return Number.isInteger(columns) && columns > 0;
}

/**
 * Calculate linear index from row and column
 * @param {number} row - Row index (0-based, must be non-negative integer)
 * @param {number} col - Column index (0-based, must be non-negative integer)
 * @param {number} columns - Number of columns in grid (must be positive integer)
 * @returns {number} Linear index, or -1 if inputs are invalid
 */
export function calculateIndex(row, col, columns) {
  if (!isValidColumns(columns) || !Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0) {
    return -1;
  }
  return row * columns + col;
}

/**
 * Calculate row and column from linear index
 * @param {number} index - Linear index (must be non-negative integer)
 * @param {number} columns - Number of columns in grid (must be positive integer)
 * @returns {{row: number, col: number}|null} Row and column, or null if inputs are invalid
 */
export function calculateRowCol(index, columns) {
  if (!isValidColumns(columns) || !Number.isInteger(index) || index < 0) {
    return null;
  }
  return {
    row: Math.floor(index / columns),
    col: index % columns
  };
}

/**
 * Check if column index is valid for the given grid
 * @param {number} col - Column index to validate
 * @param {number} columns - Number of columns in grid (must be positive integer)
 * @returns {boolean} True if col is a valid column index
 */
export function isValidColumn(col, columns) {
  if (!isValidColumns(columns)) {
    return false;
  }
  return Number.isInteger(col) && col >= 0 && col < columns;
}
