/**
 * GridController Unit Tests
 */

import { jest } from '@jest/globals';
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

  describe('addClickHandlers() and removeClickHandlers()', () => {
    beforeEach(() => {
      gridController.generate();
    });

    test('adds click handler to all squares', () => {
      const handler = jest.fn();
      gridController.addClickHandlers(handler);
      
      const squares = mockDOM.getAllGridSquares();
      squares[0].click();
      
      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('stores handler reference', () => {
      const handler = jest.fn();
      gridController.addClickHandlers(handler);
      
      expect(gridController.clickHandler).toBe(handler);
    });

    test('removes old handlers before adding new ones', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      gridController.addClickHandlers(handler1);
      gridController.addClickHandlers(handler2);
      
      const squares = mockDOM.getAllGridSquares();
      squares[0].click();
      
      // Only handler2 should be called, handler1 should have been removed
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    test('removeClickHandlers removes handler from all squares', () => {
      const handler = jest.fn();
      gridController.addClickHandlers(handler);
      gridController.removeClickHandlers();
      
      const squares = mockDOM.getAllGridSquares();
      squares[0].click();
      
      expect(handler).not.toHaveBeenCalled();
    });

    test('removeClickHandlers does nothing if no handler set', () => {
      // Should not throw
      expect(() => gridController.removeClickHandlers()).not.toThrow();
    });
  });

  describe('handleSquareClick()', () => {
    beforeEach(() => {
      gridController.generate();
    });

    test('returns undefined when game not started', () => {
      mockState.started = false;
      const event = { target: { dataset: { column: '3' } } };
      
      const result = gridController.handleSquareClick(event);
      
      expect(result).toBeUndefined();
    });

    test('returns column number when game is started', () => {
      mockState.started = true;
      const event = { target: { dataset: { column: '3' } } };
      
      const result = gridController.handleSquareClick(event);
      
      expect(result).toBe(3);
    });

    test('returns undefined for invalid column (NaN)', () => {
      mockState.started = true;
      const event = { target: { dataset: { column: 'invalid' } } };
      
      const result = gridController.handleSquareClick(event);
      
      expect(result).toBeUndefined();
    });

    test('returns undefined for column out of range (negative)', () => {
      mockState.started = true;
      const event = { target: { dataset: { column: '-1' } } };
      
      const result = gridController.handleSquareClick(event);
      
      expect(result).toBeUndefined();
    });

    test('returns undefined for column out of range (too high)', () => {
      mockState.started = true;
      const event = { target: { dataset: { column: String(CONFIG.GRID.COLUMNS) } } };
      
      const result = gridController.handleSquareClick(event);
      
      expect(result).toBeUndefined();
    });

    test('returns undefined when column is full', () => {
      mockState.started = true;
      mockState.columnFillCounts[3] = CONFIG.GRID.ROWS; // Fill column 3
      const event = { target: { dataset: { column: '3' } } };
      
      const result = gridController.handleSquareClick(event);
      
      expect(result).toBeUndefined();
    });
  });

  describe('applyGravity()', () => {
    beforeEach(() => {
      gridController.generate();
    });

    test('returns false when no letters need to move', () => {
      // Empty grid - nothing to move
      const result = gridController.applyGravity();
      
      expect(result).toBe(false);
    });

    test('returns false when letters are already at bottom', () => {
      // Place letter at bottom of column 0
      const bottomIndex = (CONFIG.GRID.ROWS - 1) * CONFIG.GRID.COLUMNS;
      const square = mockDOM.getGridSquare(bottomIndex);
      square.textContent = 'A';
      square.classList.add('filled');
      
      const result = gridController.applyGravity();
      
      expect(result).toBe(false);
    });

    test('moves letters down to fill gaps', () => {
      // Place letter at top of column 0, leave gap below
      const topIndex = 0; // row 0, col 0
      const topSquare = mockDOM.getGridSquare(topIndex);
      topSquare.textContent = 'A';
      topSquare.classList.add('filled');
      
      const result = gridController.applyGravity();
      
      // Letter should have moved to bottom
      const bottomIndex = (CONFIG.GRID.ROWS - 1) * CONFIG.GRID.COLUMNS;
      const bottomSquare = mockDOM.getGridSquare(bottomIndex);
      
      expect(result).toBe(true);
      expect(bottomSquare.textContent).toBe('A');
      expect(bottomSquare.classList.contains('filled')).toBe(true);
      expect(topSquare.textContent).toBe('');
      expect(topSquare.classList.contains('filled')).toBe(false);
    });

    test('updates column fill counts after gravity', () => {
      // Place letter at top of column 0 so gravity will move it
      const topIndex = 0; // row 0, col 0
      const topSquare = mockDOM.getGridSquare(topIndex);
      topSquare.textContent = 'A';
      topSquare.classList.add('filled');
      
      gridController.applyGravity();
      
      // After gravity, the column should have exactly one filled cell
      expect(mockState.columnFillCounts[0]).toBe(1);
    });
  });

  describe('displayReset()', () => {
    beforeEach(() => {
      gridController.generate();
    });

    test('clears all grid content', () => {
      // Fill a cell
      const square = mockDOM.getGridSquare(0);
      square.textContent = 'A';
      square.classList.add('filled');
      
      gridController.displayReset();
      
      // Grid should be empty and regenerated
      const newSquare = mockDOM.getGridSquare(0);
      expect(newSquare.textContent).toBe('');
      expect(newSquare.classList.contains('filled')).toBe(false);
    });

    test('regenerates correct number of squares', () => {
      gridController.displayReset();
      
      const squares = mockDOM.getAllGridSquares();
      expect(squares.length).toBe(CONFIG.GRID.TOTAL_CELLS);
    });

    test('removes click handlers before clearing', () => {
      const handler = jest.fn();
      gridController.addClickHandlers(handler);
      
      gridController.displayReset();
      
      // Old squares are gone, new squares don't have handler
      const squares = mockDOM.getAllGridSquares();
      squares[0].click();
      
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
