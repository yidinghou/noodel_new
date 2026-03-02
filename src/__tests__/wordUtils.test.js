import { findWords, filterOverlappingWords } from '../utils/wordUtils.js';
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

describe('diagonal word detection', () => {
  // Diagonal-down-right: each step row+1, col+1
  // idx(r,c) = r*7+c  →  (0,0)=0, (1,1)=8, (2,2)=16
  describe('diagonal-down-right', () => {
    test('finds a 3-letter diagonal-down-right word from top-left', () => {
      const grid = emptyGrid();
      setCell(grid, 0, 0, 'C');
      setCell(grid, 1, 1, 'A');
      setCell(grid, 2, 2, 'T');

      const words = findWords(grid, new Set(['CAT']));

      expect(words).toHaveLength(1);
      expect(words[0].word).toBe('CAT');
      expect(words[0].direction).toBe('diagonal-down-right');
    });

    test('finds a diagonal-down-right word at an arbitrary start position', () => {
      const grid = emptyGrid();
      setCell(grid, 2, 1, 'D');
      setCell(grid, 3, 2, 'O');
      setCell(grid, 4, 3, 'G');

      const words = findWords(grid, new Set(['DOG']));

      expect(words).toHaveLength(1);
      expect(words[0].word).toBe('DOG');
      expect(words[0].direction).toBe('diagonal-down-right');
    });

    test('returns correct indices for a diagonal-down-right word', () => {
      const grid = emptyGrid();
      // (0,0)=0, (1,1)=8, (2,2)=16
      setCell(grid, 0, 0, 'R');
      setCell(grid, 1, 1, 'U');
      setCell(grid, 2, 2, 'N');

      const words = findWords(grid, new Set(['RUN']));

      expect(words[0].indices).toEqual([0, 8, 16]);
    });
  });

  // Diagonal-up-right: each step row-1, col+1
  // "CAT" starting at (2,0): (2,0)=14, (1,1)=8, (0,2)=2
  describe('diagonal-up-right', () => {
    test('finds a 3-letter diagonal-up-right word', () => {
      const grid = emptyGrid();
      setCell(grid, 2, 0, 'C');
      setCell(grid, 1, 1, 'A');
      setCell(grid, 0, 2, 'T');

      const words = findWords(grid, new Set(['CAT']));

      expect(words).toHaveLength(1);
      expect(words[0].word).toBe('CAT');
      expect(words[0].direction).toBe('diagonal-up-right');
    });

    test('finds a diagonal-up-right word at an arbitrary start position', () => {
      const grid = emptyGrid();
      setCell(grid, 5, 1, 'D');
      setCell(grid, 4, 2, 'O');
      setCell(grid, 3, 3, 'G');

      const words = findWords(grid, new Set(['DOG']));

      expect(words).toHaveLength(1);
      expect(words[0].word).toBe('DOG');
      expect(words[0].direction).toBe('diagonal-up-right');
    });

    test('returns correct indices for a diagonal-up-right word', () => {
      const grid = emptyGrid();
      // (2,0)=14, (1,1)=8, (0,2)=2
      setCell(grid, 2, 0, 'R');
      setCell(grid, 1, 1, 'U');
      setCell(grid, 0, 2, 'N');

      const words = findWords(grid, new Set(['RUN']));

      expect(words[0].indices).toEqual([14, 8, 2]);
    });
  });

  describe('diagonal edge cases', () => {
    test('does not find a diagonal word when letters are on the same row', () => {
      const grid = emptyGrid();
      // Letters are horizontal — should NOT be found as diagonal
      setCell(grid, 0, 0, 'C');
      setCell(grid, 0, 1, 'A');
      setCell(grid, 0, 2, 'T');

      const words = findWords(grid, new Set(['CAT']));
      const directions = words.map(w => w.direction);

      expect(directions).not.toContain('diagonal-down-right');
      expect(directions).not.toContain('diagonal-up-right');
    });

    test('finds both diagonal directions simultaneously (X-cross pattern)', () => {
      const grid = emptyGrid();
      // Down-right "CAT": (0,0),(1,1),(2,2)
      setCell(grid, 0, 0, 'C'); setCell(grid, 1, 1, 'A'); setCell(grid, 2, 2, 'T');
      // Up-right "DOG": (4,0),(3,1),(2,2)
      setCell(grid, 4, 0, 'D'); setCell(grid, 3, 1, 'O'); // (2,2) already set to 'T', use different word

      // Use words that share no cells: place DOG at (5,3),(4,4),(3,5)
      setCell(grid, 5, 3, 'D'); setCell(grid, 4, 4, 'O'); setCell(grid, 3, 5, 'G');

      const words = findWords(grid, new Set(['CAT', 'DOG']));
      const dirs = words.map(w => w.direction);

      expect(dirs).toContain('diagonal-down-right');
      expect(dirs).toContain('diagonal-up-right');
    });
  });
});

// Helper: build a wordData object with the given indices and direction
function wordData(word, indices, direction) {
  return { word, indices, direction, startRow: 0, startCol: 0 };
}

describe('filterOverlappingWords', () => {
  test('passes through non-overlapping words unchanged', () => {
    const cat = wordData('CAT', [0, 1, 2], 'horizontal');
    const dog = wordData('DOG', [7, 14, 21], 'vertical');

    const result = filterOverlappingWords([cat, dog]);

    expect(result).toHaveLength(2);
  });

  test('keeps only the longer word when a shorter word is fully contained (horizontal)', () => {
    // "CAT" at [0,1,2] is contained within "CATS" at [0,1,2,3]
    const cat  = wordData('CAT',  [0, 1, 2],    'horizontal');
    const cats = wordData('CATS', [0, 1, 2, 3], 'horizontal');

    const result = filterOverlappingWords([cat, cats]);
    const words = result.map(w => w.word);

    expect(words).not.toContain('CAT');
    expect(words).toContain('CATS');
  });

  test('keeps only the longer word when a shorter word is fully contained (vertical)', () => {
    const dog  = wordData('DOG',  [0, 7, 14],     'vertical');
    const dogs = wordData('DOGS', [0, 7, 14, 21], 'vertical');

    const result = filterOverlappingWords([dog, dogs]);
    const words = result.map(w => w.word);

    expect(words).not.toContain('DOG');
    expect(words).toContain('DOGS');
  });

  test('keeps both words when same indices but different directions', () => {
    // A cell at index 5 participates in both a horizontal and a vertical word
    const horiz = wordData('CAT', [3, 4, 5], 'horizontal');
    const vert  = wordData('ACE', [5, 12, 19], 'vertical');

    const result = filterOverlappingWords([horiz, vert]);

    expect(result).toHaveLength(2);
  });

  test('returns empty array for empty input', () => {
    expect(filterOverlappingWords([])).toEqual([]);
  });

  test('handles a single word with no filtering', () => {
    const cat = wordData('CAT', [0, 1, 2], 'horizontal');
    const result = filterOverlappingWords([cat]);
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('CAT');
  });

  test('partial same-direction overlap (HAS and ASS in HASS) — should keep only one', () => {
    // H-A-S-S in row 0: HAS=[0,1,2], ASS=[1,2,3]
    // They share indices 1 and 2 but neither fully contains the other.
    // Only one should survive — both clearing would score two words from one set of cells.
    const has = wordData('HAS', [0, 1, 2], 'horizontal');
    const ass = wordData('ASS', [1, 2, 3], 'horizontal');

    const result = filterOverlappingWords([has, ass]);

    expect(result).toHaveLength(1);
  });

  test('partial vertical overlap — keeps only one word', () => {
    // H-A-S-S vertically in col 0: H(0,0)=0, A(1,0)=7, S(2,0)=14, S(3,0)=21
    // HAS=[0,7,14], ASS=[7,14,21] — share indices 7 and 14
    const has = wordData('HAS', [0, 7, 14],  'vertical');
    const ass = wordData('ASS', [7, 14, 21], 'vertical');

    const result = filterOverlappingWords([has, ass]);

    expect(result).toHaveLength(1);
  });

  test('partial diagonal-down-right overlap — keeps only one word', () => {
    // H-A-S-S diagonal-down-right: H(0,0)=0, A(1,1)=8, S(2,2)=16, S(3,3)=24
    // HAS=[0,8,16], ASS=[8,16,24] — share indices 8 and 16
    const has = wordData('HAS', [0, 8, 16],  'diagonal-down-right');
    const ass = wordData('ASS', [8, 16, 24], 'diagonal-down-right');

    const result = filterOverlappingWords([has, ass]);

    expect(result).toHaveLength(1);
  });

  test('partial diagonal-up-right overlap — keeps only one word', () => {
    // H-A-S-S diagonal-up-right: H(3,0)=21, A(2,1)=15, S(1,2)=9, S(0,3)=3
    // HAS=[21,15,9], ASS=[15,9,3] — share indices 15 and 9
    const has = wordData('HAS', [21, 15, 9], 'diagonal-up-right');
    const ass = wordData('ASS', [15, 9,  3], 'diagonal-up-right');

    const result = filterOverlappingWords([has, ass]);

    expect(result).toHaveLength(1);
  });
});

describe('findWords – partial overlap integration', () => {
  test('horizontal HASS: HAS+ASS in dictionary should only detect one word', () => {
    const grid = emptyGrid();
    setCell(grid, 0, 0, 'H');
    setCell(grid, 0, 1, 'A');
    setCell(grid, 0, 2, 'S');
    setCell(grid, 0, 3, 'S');

    const words = findWords(grid, new Set(['HAS', 'ASS']));
    const filtered = filterOverlappingWords(words);

    expect(filtered).toHaveLength(1);
  });

  test('vertical HASS: HAS+ASS in dictionary should only detect one word', () => {
    // H(0,0), A(1,0), S(2,0), S(3,0) — all in col 0
    const grid = emptyGrid();
    setCell(grid, 0, 0, 'H');
    setCell(grid, 1, 0, 'A');
    setCell(grid, 2, 0, 'S');
    setCell(grid, 3, 0, 'S');

    const words = findWords(grid, new Set(['HAS', 'ASS']));
    const filtered = filterOverlappingWords(words);

    expect(filtered).toHaveLength(1);
  });

  test('diagonal-down-right HASS: HAS+ASS in dictionary should only detect one word', () => {
    // H(0,0), A(1,1), S(2,2), S(3,3)
    const grid = emptyGrid();
    setCell(grid, 0, 0, 'H');
    setCell(grid, 1, 1, 'A');
    setCell(grid, 2, 2, 'S');
    setCell(grid, 3, 3, 'S');

    const words = findWords(grid, new Set(['HAS', 'ASS']));
    const filtered = filterOverlappingWords(words);

    expect(filtered).toHaveLength(1);
  });

  test('diagonal-up-right HASS: HAS+ASS in dictionary should only detect one word', () => {
    // H(3,0), A(2,1), S(1,2), S(0,3)
    const grid = emptyGrid();
    setCell(grid, 3, 0, 'H');
    setCell(grid, 2, 1, 'A');
    setCell(grid, 1, 2, 'S');
    setCell(grid, 0, 3, 'S');

    const words = findWords(grid, new Set(['HAS', 'ASS']));
    const filtered = filterOverlappingWords(words);

    expect(filtered).toHaveLength(1);
  });
});
