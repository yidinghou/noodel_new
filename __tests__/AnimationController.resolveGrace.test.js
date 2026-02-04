/**
 * AnimationController Resolve Grace Unit Tests
 */

import { jest } from '@jest/globals';
import { AnimationController } from '../js/animation/AnimationController.js';
import { CONFIG } from '../js/config.js';

/**
 * Create a mock DOM cache for testing
 */
function createMockDOMCache() {
  const gridContainer = document.createElement('div');
  gridContainer.id = 'game-grid';
  document.body.appendChild(gridContainer);

  // Create grid squares
  for (let i = 0; i < CONFIG.GRID.TOTAL_CELLS; i++) {
    const square = document.createElement('div');
    square.className = 'block-base grid-square';
    square.dataset.index = String(i);
    square.dataset.column = String(i % CONFIG.GRID.COLUMNS);
    square.dataset.row = String(Math.floor(i / CONFIG.GRID.COLUMNS));
    gridContainer.appendChild(square);
  }

  return {
    grid: gridContainer,
    getAllGridSquares: () => gridContainer.querySelectorAll('.grid-square'),
    getGridSquare: (index) => gridContainer.querySelector(`[data-index="${index}"]`)
  };
}

/**
 * Clean up DOM after each test
 */
function cleanupDOM() {
  document.body.innerHTML = '';
}

describe('AnimationController - Resolve Grace', () => {
  let animationController;
  let mockDOM;

  beforeEach(() => {
    mockDOM = createMockDOMCache();
    animationController = new AnimationController(mockDOM, null);
  });

  afterEach(() => {
    cleanupDOM();
  });

  describe('startResolveGrace()', () => {
    test('creates controller with correct structure', () => {
      const positions = [{ index: 0 }, { index: 1 }];
      const controller = animationController.startResolveGrace(positions, 1000);

      expect(controller).toBeDefined();
      expect(controller.promise).toBeInstanceOf(Promise);
      expect(typeof controller.cancel).toBe('function');
      expect(typeof controller.finalize).toBe('function');
      expect(controller.nodes).toHaveLength(2);
      expect(controller.positions).toBe(positions);
    });

    test('adds word-found and resolving classes to squares', () => {
      const positions = [{ index: 0 }, { index: 1 }];
      animationController.startResolveGrace(positions, 1000);

      const square0 = mockDOM.getGridSquare(0);
      const square1 = mockDOM.getGridSquare(1);

      expect(square0.classList.contains('word-found')).toBe(true);
      expect(square0.classList.contains('resolving')).toBe(true);
      expect(square1.classList.contains('word-found')).toBe(true);
      expect(square1.classList.contains('resolving')).toBe(true);
    });

    test('creates fill overlay elements', () => {
      const positions = [{ index: 0 }];
      animationController.startResolveGrace(positions, 1000);

      const square = mockDOM.getGridSquare(0);
      const fillElement = square.querySelector('.fill');

      expect(fillElement).toBeDefined();
      expect(fillElement.className).toBe('fill');
    });

    test('wraps text content in letter-content span', () => {
      const square = mockDOM.getGridSquare(0);
      square.textContent = 'A';
      
      const positions = [{ index: 0 }];
      animationController.startResolveGrace(positions, 1000);

      const letterContent = square.querySelector('.letter-content');
      expect(letterContent).toBeDefined();
      expect(letterContent.textContent).toBe('A');
    });

    test('adds controller to registry', () => {
      const positions = [{ index: 0 }];
      animationController.startResolveGrace(positions, 1000);

      expect(animationController._activeResolveControllers).toHaveLength(1);
    });

    test('promise resolves after duration', async () => {
      const positions = [{ index: 0 }];
      const controller = animationController.startResolveGrace(positions, 100);

      const result = await controller.promise;

      expect(result.positions).toBe(positions);
      expect(result.nodes).toHaveLength(1);
      expect(result.canceled).toBe(false);
    });
  });

  describe('cancelResolveGrace()', () => {
    test('removes resolving class from squares', () => {
      const positions = [{ index: 0 }, { index: 1 }];
      const controller = animationController.startResolveGrace(positions, 1000);

      animationController.cancelResolveGrace(controller);

      const square0 = mockDOM.getGridSquare(0);
      const square1 = mockDOM.getGridSquare(1);

      expect(square0.classList.contains('resolving')).toBe(false);
      expect(square1.classList.contains('resolving')).toBe(false);
    });

    test('removes controller from registry', () => {
      const positions = [{ index: 0 }];
      const controller = animationController.startResolveGrace(positions, 1000);

      expect(animationController._activeResolveControllers).toHaveLength(1);

      animationController.cancelResolveGrace(controller);

      expect(animationController._activeResolveControllers).toHaveLength(0);
    });

    test('promise resolves with canceled flag', async () => {
      const positions = [{ index: 0 }];
      const controller = animationController.startResolveGrace(positions, 100);

      animationController.cancelResolveGrace(controller);

      const result = await controller.promise;
      expect(result.canceled).toBe(true);
    });

    test('does nothing if controller is null', () => {
      expect(() => animationController.cancelResolveGrace(null)).not.toThrow();
    });
  });

  describe('cancelResolveGracesIntersecting()', () => {
    test('cancels controllers that intersect with cell index', () => {
      const positions1 = [{ index: 0 }, { index: 1 }];
      const positions2 = [{ index: 2 }, { index: 3 }];
      
      animationController.startResolveGrace(positions1, 1000);
      animationController.startResolveGrace(positions2, 1000);

      expect(animationController._activeResolveControllers).toHaveLength(2);

      // Cancel controllers intersecting with cell 1
      animationController.cancelResolveGracesIntersecting(1);

      // Only first controller should be canceled
      expect(animationController._activeResolveControllers).toHaveLength(1);
      
      const square0 = mockDOM.getGridSquare(0);
      const square2 = mockDOM.getGridSquare(2);
      
      expect(square0.classList.contains('resolving')).toBe(false);
      expect(square2.classList.contains('resolving')).toBe(true);
    });

    test('cancels multiple controllers if they intersect', () => {
      const positions1 = [{ index: 0 }, { index: 1 }];
      const positions2 = [{ index: 1 }, { index: 2 }];
      
      animationController.startResolveGrace(positions1, 1000);
      animationController.startResolveGrace(positions2, 1000);

      expect(animationController._activeResolveControllers).toHaveLength(2);

      // Cancel controllers intersecting with cell 1
      animationController.cancelResolveGracesIntersecting(1);

      // Both controllers should be canceled
      expect(animationController._activeResolveControllers).toHaveLength(0);
    });

    test('does nothing if no controllers intersect', () => {
      const positions = [{ index: 0 }, { index: 1 }];
      animationController.startResolveGrace(positions, 1000);

      expect(animationController._activeResolveControllers).toHaveLength(1);

      // Cancel controllers intersecting with cell 5 (doesn't exist)
      animationController.cancelResolveGracesIntersecting(5);

      // Controller should still be active
      expect(animationController._activeResolveControllers).toHaveLength(1);
    });
  });

  describe('finalizeResolveGrace()', () => {
    test('removes resolving and adds resolved class', () => {
      const positions = [{ index: 0 }];
      const controller = animationController.startResolveGrace(positions, 1000);

      animationController.finalizeResolveGrace(controller);

      const square = mockDOM.getGridSquare(0);
      expect(square.classList.contains('resolving')).toBe(false);
      expect(square.classList.contains('resolved')).toBe(true);
    });

    test('removes controller from registry', () => {
      const positions = [{ index: 0 }];
      const controller = animationController.startResolveGrace(positions, 1000);

      expect(animationController._activeResolveControllers).toHaveLength(1);

      animationController.finalizeResolveGrace(controller);

      expect(animationController._activeResolveControllers).toHaveLength(0);
    });

    test('does nothing if controller is null', () => {
      expect(() => animationController.finalizeResolveGrace(null)).not.toThrow();
    });
  });

  describe('cancelAllResolveGraces()', () => {
    test('cancels all active controllers', () => {
      const positions1 = [{ index: 0 }];
      const positions2 = [{ index: 1 }];
      const positions3 = [{ index: 2 }];
      
      animationController.startResolveGrace(positions1, 1000);
      animationController.startResolveGrace(positions2, 1000);
      animationController.startResolveGrace(positions3, 1000);

      expect(animationController._activeResolveControllers).toHaveLength(3);

      animationController.cancelAllResolveGraces();

      expect(animationController._activeResolveControllers).toHaveLength(0);
    });

    test('removes resolving class from all squares', () => {
      const positions1 = [{ index: 0 }];
      const positions2 = [{ index: 1 }];
      
      animationController.startResolveGrace(positions1, 1000);
      animationController.startResolveGrace(positions2, 1000);

      animationController.cancelAllResolveGraces();

      const square0 = mockDOM.getGridSquare(0);
      const square1 = mockDOM.getGridSquare(1);

      expect(square0.classList.contains('resolving')).toBe(false);
      expect(square1.classList.contains('resolving')).toBe(false);
    });

    test('does nothing if no active controllers', () => {
      expect(() => animationController.cancelAllResolveGraces()).not.toThrow();
      expect(animationController._activeResolveControllers).toHaveLength(0);
    });
  });

  describe('clearWordCells()', () => {
    test('removes resolve-related classes', () => {
      const positions = [{ index: 0 }];
      const controller = animationController.startResolveGrace(positions, 1000);
      
      // Finalize to add resolved class
      controller.finalize();

      const square = mockDOM.getGridSquare(0);
      expect(square.classList.contains('word-found')).toBe(true);
      expect(square.classList.contains('resolved')).toBe(true);

      animationController.clearWordCells(positions);

      expect(square.classList.contains('word-found')).toBe(false);
      expect(square.classList.contains('resolving')).toBe(false);
      expect(square.classList.contains('resolved')).toBe(false);
    });

    test('removes fill overlay element', () => {
      const positions = [{ index: 0 }];
      animationController.startResolveGrace(positions, 1000);

      const square = mockDOM.getGridSquare(0);
      expect(square.querySelector('.fill')).toBeDefined();

      animationController.clearWordCells(positions);

      expect(square.querySelector('.fill')).toBeNull();
    });
  });
});
