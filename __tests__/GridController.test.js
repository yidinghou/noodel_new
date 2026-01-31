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
});
