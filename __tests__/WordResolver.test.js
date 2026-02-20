/**
 * WordResolver Unit Tests
 */

import { WordResolver } from '../js/word/WordResolver.js';
import { CONFIG } from '../js/config.js';

/**
 * Create a mock DOM cache with grid for testing
 */
function createMockDOMCache() {
  const gridContainer = document.createElement('div');
  gridContainer.id = 'game-grid';
  
  // Create grid squares
  for (let i = 0; i < CONFIG.GRID.TOTAL_CELLS; i++) {
    const square = document.createElement('div');
    square.className = 'block-base grid-square';
    square.dataset.index = i;
    square.dataset.column = i % CONFIG.GRID.COLUMNS;
    square.dataset.row = Math.floor(i / CONFIG.GRID.COLUMNS);
    gridContainer.appendChild(square);
  }
  
  document.body.appendChild(gridContainer);

  return {
    grid: gridContainer,
    getAllGridSquares: () => gridContainer.querySelectorAll('.grid-square'),
    getGridSquare: (index) => gridContainer.querySelector(`[data-index="${index}"]`)
  };
}

/**
 * Create a mock game state
 */
function createMockGameState() {
  return {
    started: true
  };
}

/**
 * Create a mock dictionary
 */
function createMockDictionary(words = []) {
  const dict = new Map();
  words.forEach(word => dict.set(word, `Definition of ${word}`));
  return dict;
}

/**
 * Helper to place a letter on the grid
 */
function placeLetter(dom, row, col, letter) {
  const index = row * CONFIG.GRID.COLUMNS + col;
  const square = dom.getGridSquare(index);
  if (square) {
    square.textContent = letter;
    square.classList.add('filled');
  }
}

/**
 * Helper to place a word horizontally
 */
function placeHorizontalWord(dom, row, startCol, word) {
  for (let i = 0; i < word.length; i++) {
    placeLetter(dom, row, startCol + i, word[i]);
  }
}

/**
 * Helper to place a word vertically
 */
function placeVerticalWord(dom, startRow, col, word) {
  for (let i = 0; i < word.length; i++) {
    placeLetter(dom, startRow + i, col, word[i]);
  }
}

/**
 * Clean up DOM after each test
 */
function cleanupDOM() {
  document.body.innerHTML = '';
}

describe('WordResolver', () => {
  let resolver;
  let mockDOM;
  let mockState;
  let mockDictionary;

  beforeEach(() => {
    mockDOM = createMockDOMCache();
    mockState = createMockGameState();
    mockDictionary = createMockDictionary(['CAT', 'DOG', 'BAT', 'HAT', 'THE', 'AND']);
    resolver = new WordResolver(mockState, mockDOM, mockDictionary);
  });

  afterEach(() => {
    cleanupDOM();
  });

  test('can be instantiated with dependencies', () => {
    expect(resolver).toBeDefined();
    expect(resolver.gameState).toBe(mockState);
    expect(resolver.dom).toBe(mockDOM);
    expect(resolver.dictionary).toBe(mockDictionary);
  });

  describe('extractWord()', () => {
    test('extracts horizontal word correctly', () => {
      placeHorizontalWord(mockDOM, 0, 0, 'CAT');
      
      const result = resolver.extractWord(0, 0, 0, 1, 3);
      
      expect(result.word).toBe('CAT');
      expect(result.direction).toBe('horizontal');
      expect(result.positions.length).toBe(3);
    });

    test('extracts vertical word correctly', () => {
      placeVerticalWord(mockDOM, 0, 0, 'DOG');
      
      const result = resolver.extractWord(0, 0, 1, 0, 3);
      
      expect(result.word).toBe('DOG');
      expect(result.direction).toBe('vertical');
      expect(result.positions.length).toBe(3);
    });

    test('returns null for empty cells', () => {
      placeLetter(mockDOM, 0, 0, 'C');
      placeLetter(mockDOM, 0, 1, 'A');
      // No letter at (0, 2)
      
      const result = resolver.extractWord(0, 0, 0, 1, 3);
      
      expect(result).toBeNull();
    });

    test('includes definition from dictionary', () => {
      placeHorizontalWord(mockDOM, 0, 0, 'CAT');
      
      const result = resolver.extractWord(0, 0, 0, 1, 3);
      
      expect(result.definition).toBe('Definition of CAT');
    });

    test('provides fallback definition for unknown words', () => {
      placeHorizontalWord(mockDOM, 0, 0, 'XYZ');
      
      const result = resolver.extractWord(0, 0, 0, 1, 3);
      
      expect(result.definition).toBe('No definition available');
    });
  });

  describe('checkHorizontal()', () => {
    test('detects horizontal word', () => {
      placeHorizontalWord(mockDOM, 0, 0, 'CAT');
      
      const words = resolver.checkHorizontal();
      
      expect(words.length).toBe(1);
      expect(words[0].word).toBe('CAT');
      expect(words[0].direction).toBe('horizontal');
    });

    test('detects multiple horizontal words', () => {
      placeHorizontalWord(mockDOM, 0, 0, 'CAT');
      placeHorizontalWord(mockDOM, 2, 0, 'DOG');
      
      const words = resolver.checkHorizontal();
      
      expect(words.length).toBe(2);
      expect(words.map(w => w.word)).toContain('CAT');
      expect(words.map(w => w.word)).toContain('DOG');
    });

    test('ignores non-dictionary words', () => {
      placeHorizontalWord(mockDOM, 0, 0, 'XYZ');
      
      const words = resolver.checkHorizontal();
      
      expect(words.length).toBe(0);
    });
  });

  describe('checkVertical()', () => {
    test('detects vertical word', () => {
      placeVerticalWord(mockDOM, 0, 0, 'CAT');
      
      const words = resolver.checkVertical();
      
      expect(words.length).toBe(1);
      expect(words[0].word).toBe('CAT');
      expect(words[0].direction).toBe('vertical');
    });

    test('detects multiple vertical words', () => {
      placeVerticalWord(mockDOM, 0, 0, 'CAT');
      placeVerticalWord(mockDOM, 0, 2, 'DOG');
      
      const words = resolver.checkVertical();
      
      expect(words.length).toBe(2);
    });
  });

  describe('checkDiagonals()', () => {
    test('detects diagonal down-right word', () => {
      // Place CAT diagonally: (0,0), (1,1), (2,2)
      placeLetter(mockDOM, 0, 0, 'C');
      placeLetter(mockDOM, 1, 1, 'A');
      placeLetter(mockDOM, 2, 2, 'T');
      
      const words = resolver.checkDiagonals();
      
      expect(words.length).toBe(1);
      expect(words[0].word).toBe('CAT');
      expect(words[0].direction).toBe('diagonal-down-right');
    });

    test('detects diagonal up-right word', () => {
      // Place CAT diagonally up-right: (2,0), (1,1), (0,2)
      placeLetter(mockDOM, 2, 0, 'C');
      placeLetter(mockDOM, 1, 1, 'A');
      placeLetter(mockDOM, 0, 2, 'T');
      
      const words = resolver.checkDiagonals();
      
      expect(words.length).toBe(1);
      expect(words[0].word).toBe('CAT');
      expect(words[0].direction).toBe('diagonal-up-right');
    });
  });

  describe('filterOverlappingWords()', () => {
    test('keeps longer word when words overlap', () => {
      // Create overlapping words where one contains the other
      const words = [
        { word: 'CAT', positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }] },
        { word: 'CATS', positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }] }
      ];

      const filtered = resolver.filterOverlappingWords(words);

      expect(filtered.length).toBe(1);
      expect(filtered[0].word).toBe('CATS');
    });

    test('keeps non-overlapping words', () => {
      const words = [
        { word: 'CAT', positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }] },
        { word: 'DOG', positions: [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }] }
      ];

      const filtered = resolver.filterOverlappingWords(words);

      expect(filtered.length).toBe(2);
    });

    test('returns empty array for empty input', () => {
      const filtered = resolver.filterOverlappingWords([]);

      expect(filtered).toEqual([]);
    });

    test('keeps only one word when two same-length words share cells (e.g. HAS and ASS in HASS)', () => {
      // H-A-S-S: HAS at cols 0-2 and ASS at cols 1-3 share cells (0,1) and (0,2)
      // Only one should survive filtering
      const words = [
        { word: 'HAS', positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }] },
        { word: 'ASS', positions: [{ row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }] }
      ];

      const filtered = resolver.filterOverlappingWords(words);

      expect(filtered.length).toBe(1);
    });
  });

  describe('checkHorizontal() - partial overlap bug', () => {
    test('HASS grid detects only one word, not both HAS and ASS', () => {
      resolver = new WordResolver(
        mockState,
        mockDOM,
        createMockDictionary(['HAS', 'ASS'])
      );
      // Place H-A-S-S in row 0
      placeHorizontalWord(mockDOM, 0, 0, 'HASS');

      const words = resolver.checkHorizontal();

      // HAS (cols 0-2) and ASS (cols 1-3) share cells — only one should be returned
      expect(words.length).toBe(1);
    });
  });

  describe('checkForWords()', () => {
    test('finds words in all directions', () => {
      // Place horizontal CAT
      placeHorizontalWord(mockDOM, 0, 0, 'CAT');
      // Place vertical DOG (not overlapping)
      placeVerticalWord(mockDOM, 3, 4, 'DOG');
      
      const words = resolver.checkForWords();
      
      expect(words.length).toBe(2);
      expect(words.map(w => w.word)).toContain('CAT');
      expect(words.map(w => w.word)).toContain('DOG');
    });

    test('returns empty array when no words found', () => {
      // Place non-dictionary word
      placeHorizontalWord(mockDOM, 0, 0, 'XYZ');
      
      const words = resolver.checkForWords();
      
      expect(words.length).toBe(0);
    });

    test('returns empty array for empty grid', () => {
      const words = resolver.checkForWords();
      
      expect(words.length).toBe(0);
    });
  });

  describe('getDirectionName()', () => {
    test('returns correct direction names', () => {
      expect(resolver.getDirectionName(0, 1)).toBe('horizontal');
      expect(resolver.getDirectionName(1, 0)).toBe('vertical');
      expect(resolver.getDirectionName(1, 1)).toBe('diagonal-down-right');
      expect(resolver.getDirectionName(-1, 1)).toBe('diagonal-up-right');
      expect(resolver.getDirectionName(0, 0)).toBe('unknown');
    });
  });
});
