/**
 * WordResolver Unit Tests
 */

import { jest } from '@jest/globals';
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
});
