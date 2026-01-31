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

/**
 * Check if row index is valid for the given grid
 * @param {number} row - Row index to validate
 * @param {number} rows - Number of rows in grid (must be positive integer)
 * @returns {boolean} True if row is a valid row index
 */
export function isValidRow(row, rows) {
  if (!Number.isInteger(rows) || rows <= 0) {
    return false;
  }
  return Number.isInteger(row) && row >= 0 && row < rows;
}

/**
 * Check if a position is within grid bounds
 * @param {number} row - Row index to validate
 * @param {number} col - Column index to validate
 * @param {number} rows - Number of rows in grid
 * @param {number} columns - Number of columns in grid
 * @returns {boolean} True if position is within bounds
 */
export function isWithinBounds(row, col, rows, columns) {
  return isValidRow(row, rows) && isValidColumn(col, columns);
}

/**
 * Check if a word can be extracted from the given starting position
 * @param {number} startRow - Starting row index
 * @param {number} startCol - Starting column index
 * @param {number} rowDelta - Row direction (-1, 0, or 1)
 * @param {number} colDelta - Column direction (-1, 0, or 1)
 * @param {number} length - Length of word to extract
 * @param {number} rows - Number of rows in grid
 * @param {number} columns - Number of columns in grid
 * @returns {boolean} True if word extraction is possible
 */
export function canExtractWord(startRow, startCol, rowDelta, colDelta, length, rows, columns) {
  // Validate inputs
  if (!Number.isInteger(length) || length < 1) {
    return false;
  }
  if (!isWithinBounds(startRow, startCol, rows, columns)) {
    return false;
  }
  
  // Calculate end position
  const endRow = startRow + (length - 1) * rowDelta;
  const endCol = startCol + (length - 1) * colDelta;
  
  // Check if end position is within bounds
  return isWithinBounds(endRow, endCol, rows, columns);
}
