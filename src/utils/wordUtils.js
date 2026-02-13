import { GRID_COLS, GRID_ROWS } from './gameConstants.js';

// Extract a word from grid in specified direction
function extractWord(grid, startRow, startCol, rowDelta, colDelta, length) {
  const letters = [];
  const indices = [];

  for (let i = 0; i < length; i++) {
    const row = startRow + i * rowDelta;
    const col = startCol + i * colDelta;
    const index = row * GRID_COLS + col;
    const cell = grid[index];

    if (!cell || !cell.char) return null;

    letters.push(cell.char);
    indices.push(index);
  }

  return {
    word: letters.join(''),
    indices,
    startRow,
    startCol,
    direction: rowDelta === 0 ? 'horizontal' : 'vertical'
  };
}

// Find all words on the grid
export function findWords(grid, dictionary) {
  if (!dictionary) return [];

  const foundWords = [];

  // Check horizontal (rows)
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      for (let length = 3; length <= GRID_COLS - col; length++) {
        const wordData = extractWord(grid, row, col, 0, 1, length);
        if (wordData && dictionary.has(wordData.word)) {
          foundWords.push(wordData);
        }
      }
    }
  }

  // Check vertical (columns)
  for (let col = 0; col < GRID_COLS; col++) {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let length = 3; length <= GRID_ROWS - row; length++) {
        const wordData = extractWord(grid, row, col, 1, 0, length);
        if (wordData && dictionary.has(wordData.word)) {
          foundWords.push(wordData);
        }
      }
    }
  }

  return foundWords;
}
