/**
 * GridController Unit Tests
 */

import { GridController } from '../js/grid/GridController.js';
import { CONFIG } from '../js/config.js';

/**
 * Create a mock DOM cache for testing
 */
function createMockDOMCache() {
  // Create a container for the grid
  const gridContainer = document.createElement('div');
  gridContainer.id = 'game-grid';
  document.body.appendChild(gridContainer);

  return {
    grid: gridContainer,
    getAllGridSquares: () => gridContainer.querySelectorAll('.grid-square'),
    getGridSquare: (index) => gridContainer.querySelector(`[data-index="${index}"]`)
  };
}

/**
 * Create a mock game state for testing
 */
function createMockGameState() {
  return {
    started: false,
    columnFillCounts: new Array(CONFIG.GRID.COLUMNS).fill(0),
    isColumnFull: function(col) {
      return this.columnFillCounts[col] >= CONFIG.GRID.ROWS;
    }
  };
}

/**
 * Clean up DOM after each test
 */
function cleanupDOM() {
  document.body.innerHTML = '';
}

describe('GridController', () => {
  let gridController;
  let mockDOM;
  let mockState;

  beforeEach(() => {
    mockDOM = createMockDOMCache();
    mockState = createMockGameState();
    gridController = new GridController(mockState, mockDOM);
  });

  afterEach(() => {
    cleanupDOM();
  });

  test('can be instantiated with mock dependencies', () => {
    expect(gridController).toBeDefined();
    expect(gridController.gameState).toBe(mockState);
    expect(gridController.dom).toBe(mockDOM);
  });

  describe('generate()', () => {
    test('creates correct number of grid squares', () => {
      gridController.generate();
      
      const squares = mockDOM.getAllGridSquares();
      expect(squares.length).toBe(CONFIG.GRID.TOTAL_CELLS);
    });

    test('each square has correct CSS classes', () => {
      gridController.generate();
      
      const squares = mockDOM.getAllGridSquares();
      squares.forEach(square => {
        expect(square.classList.contains('block-base')).toBe(true);
        expect(square.classList.contains('grid-square')).toBe(true);
      });
    });

    test('each square has correct data attributes', () => {
      gridController.generate();
      
      const squares = mockDOM.getAllGridSquares();
      squares.forEach((square, i) => {
        expect(square.dataset.index).toBe(String(i));
        expect(square.dataset.column).toBe(String(i % CONFIG.GRID.COLUMNS));
        expect(square.dataset.row).toBe(String(Math.floor(i / CONFIG.GRID.COLUMNS)));
      });
    });

    test('squares are appended to grid container', () => {
      gridController.generate();
      
      expect(mockDOM.grid.children.length).toBe(CONFIG.GRID.TOTAL_CELLS);
    });
  });
});
