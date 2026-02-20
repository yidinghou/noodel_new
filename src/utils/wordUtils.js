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

  let direction;
  if (rowDelta === 0)        direction = 'horizontal';
  else if (colDelta === 0)   direction = 'vertical';
  else if (rowDelta === 1)   direction = 'diagonal-down-right';
  else                       direction = 'diagonal-up-right';

  return { word: letters.join(''), indices, startRow, startCol, direction };
}

// Filter overlapping words in the same direction, keeping the longest.
// When same-direction words share any cell, the longer word wins.
// Equal-length partial overlaps keep the first-encountered word.
export function filterOverlappingWords(words) {
  const filtered = [];

  for (const word of words) {
    const wordSet = new Set(word.indices);
    let skip = false;

    for (let i = filtered.length - 1; i >= 0; i--) {
      const other = filtered[i];
      if (other.direction !== word.direction) continue;

      const shares = other.indices.some(idx => wordSet.has(idx));
      if (!shares) continue;

      if (word.indices.length > other.indices.length) {
        // New word is longer — replace the shorter overlapping word
        filtered.splice(i, 1);
      } else {
        // New word is same length or shorter — first/longest wins
        skip = true;
        break;
      }
    }

    if (!skip) filtered.push(word);
  }

  return filtered;
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

  // Check diagonal-down-right (rowDelta=1, colDelta=1)
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const maxLen = Math.min(GRID_ROWS - row, GRID_COLS - col);
      for (let length = 3; length <= maxLen; length++) {
        const wordData = extractWord(grid, row, col, 1, 1, length);
        if (wordData && dictionary.has(wordData.word)) {
          foundWords.push(wordData);
        }
      }
    }
  }

  // Check diagonal-up-right (rowDelta=-1, colDelta=1)
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const maxLen = Math.min(row + 1, GRID_COLS - col);
      for (let length = 3; length <= maxLen; length++) {
        const wordData = extractWord(grid, row, col, -1, 1, length);
        if (wordData && dictionary.has(wordData.word)) {
          foundWords.push(wordData);
        }
      }
    }
  }

  return foundWords;
}
