import { findWords } from '../utils/wordUtils.js';
import { GRID_COLS, GRID_SIZE } from '../utils/gameConstants.js';

// Helpers
function emptyGrid() {
  return Array(GRID_SIZE).fill(null);
}

function cell(char) {
  return { char, id: `tile-${char}`, type: 'filled', isMatched: false };
}

function idx(row, col) {
  return row * GRID_COLS + col;
}

function setCell(grid, row, col, char) {
  grid[idx(row, col)] = cell(char);
  return grid;
}

describe('findWords', () => {
  describe('horizontal word detection', () => {
    test('finds a 3-letter word in the bottom row', () => {
      const grid = emptyGrid();
      setCell(grid, 5, 0, 'C');
      setCell(grid, 5, 1, 'A');
      setCell(grid, 5, 2, 'T');

      const words = findWords(grid, new Set(['CAT']));

      expect(words).toHaveLength(1);
      expect(words[0].word).toBe('CAT');
      expect(words[0].direction).toBe('horizontal');
    });

    test('finds a word at an arbitrary position in a row', () => {
      const grid = emptyGrid();
      setCell(grid, 2, 3, 'D');
      setCell(grid, 2, 4, 'O');
      setCell(grid, 2, 5, 'G');

      const words = findWords(grid, new Set(['DOG']));

      expect(words).toHaveLength(1);
      expect(words[0].word).toBe('DOG');
      expect(words[0].direction).toBe('horizontal');
    });

    test('returns correct flat indices for a horizontal word', () => {
      const grid = emptyGrid();
      // Row 0, cols 0-2 → indices 0, 1, 2
      setCell(grid, 0, 0, 'R');
      setCell(grid, 0, 1, 'U');
      setCell(grid, 0, 2, 'N');

      const words = findWords(grid, new Set(['RUN']));

      expect(words[0].indices).toEqual([0, 1, 2]);
    });

    test('finds a 4-letter horizontal word', () => {
      const grid = emptyGrid();
      setCell(grid, 5, 0, 'W');
      setCell(grid, 5, 1, 'O');
      setCell(grid, 5, 2, 'R');
      setCell(grid, 5, 3, 'D');

      const words = findWords(grid, new Set(['WORD']));

      expect(words).toHaveLength(1);
      expect(words[0].word).toBe('WORD');
    });

    test('finds both the shorter and longer word when both are valid', () => {
      const grid = emptyGrid();
      setCell(grid, 5, 0, 'C');
      setCell(grid, 5, 1, 'A');
      setCell(grid, 5, 2, 'T');
      setCell(grid, 5, 3, 'S');

      const words = findWords(grid, new Set(['CAT', 'CATS']));
      const wordStrings = words.map(w => w.word);

      expect(wordStrings).toContain('CAT');
      expect(wordStrings).toContain('CATS');
    });
  });

  describe('vertical word detection', () => {
    test('finds a 3-letter word in a column', () => {
      const grid = emptyGrid();
      setCell(grid, 3, 0, 'D');
      setCell(grid, 4, 0, 'O');
      setCell(grid, 5, 0, 'G');

      const words = findWords(grid, new Set(['DOG']));

      expect(words).toHaveLength(1);
      expect(words[0].word).toBe('DOG');
      expect(words[0].direction).toBe('vertical');
    });

    test('finds a vertical word in any column', () => {
      const grid = emptyGrid();
      setCell(grid, 3, 4, 'C');
      setCell(grid, 4, 4, 'A');
      setCell(grid, 5, 4, 'T');

      const words = findWords(grid, new Set(['CAT']));

      expect(words).toHaveLength(1);
      expect(words[0].word).toBe('CAT');
      expect(words[0].direction).toBe('vertical');
    });

    test('returns correct flat indices for a vertical word', () => {
      const grid = emptyGrid();
      // Col 0, rows 0-2 → indices 0, 7, 14
      setCell(grid, 0, 0, 'R');
      setCell(grid, 1, 0, 'U');
      setCell(grid, 2, 0, 'N');

      const words = findWords(grid, new Set(['RUN']));

      expect(words[0].indices).toEqual([0, 7, 14]);
    });

    test('finds a 4-letter vertical word', () => {
      const grid = emptyGrid();
      setCell(grid, 2, 3, 'W');
      setCell(grid, 3, 3, 'O');
      setCell(grid, 4, 3, 'R');
      setCell(grid, 5, 3, 'D');

      const words = findWords(grid, new Set(['WORD']));

      expect(words).toHaveLength(1);
      expect(words[0].word).toBe('WORD');
    });

    test('finds a 6-letter vertical word spanning a full column', () => {
      const grid = emptyGrid();
      setCell(grid, 0, 2, 'P');
      setCell(grid, 1, 2, 'L');
      setCell(grid, 2, 2, 'A');
      setCell(grid, 3, 2, 'N');
      setCell(grid, 4, 2, 'E');
      setCell(grid, 5, 2, 'S');

      const words = findWords(grid, new Set(['PLANES']));

      expect(words).toHaveLength(1);
      expect(words[0].word).toBe('PLANES');
    });
  });

  describe('simultaneous multi-word detection', () => {
    test('finds both a horizontal and a vertical word at the same time', () => {
      const grid = emptyGrid();
      // Horizontal "CAT" in row 5
      setCell(grid, 5, 0, 'C');
      setCell(grid, 5, 1, 'A');
      setCell(grid, 5, 2, 'T');
      // Vertical "DOG" in col 6
      setCell(grid, 3, 6, 'D');
      setCell(grid, 4, 6, 'O');
      setCell(grid, 5, 6, 'G');

      const words = findWords(grid, new Set(['CAT', 'DOG']));
      const wordStrings = words.map(w => w.word);

      expect(wordStrings).toContain('CAT');
      expect(wordStrings).toContain('DOG');
    });

    test('does not find words shorter than 3 letters', () => {
      const grid = emptyGrid();
      setCell(grid, 5, 0, 'I');
      setCell(grid, 5, 1, 'T');

      const words = findWords(grid, new Set(['IT']));

      expect(words).toHaveLength(0);
    });

    test('does not find sequences not in the dictionary', () => {
      const grid = emptyGrid();
      setCell(grid, 5, 0, 'X');
      setCell(grid, 5, 1, 'X');
      setCell(grid, 5, 2, 'X');

      const words = findWords(grid, new Set(['CAT']));

      expect(words).toHaveLength(0);
    });

    test('returns empty array when dictionary is null', () => {
      const grid = emptyGrid();
      setCell(grid, 5, 0, 'C');
      setCell(grid, 5, 1, 'A');
      setCell(grid, 5, 2, 'T');

      expect(findWords(grid, null)).toEqual([]);
    });

    test('returns empty array on a fully empty grid', () => {
      const words = findWords(emptyGrid(), new Set(['CAT']));
      expect(words).toEqual([]);
    });
  });
});
