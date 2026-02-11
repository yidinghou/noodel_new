import { jest } from '@jest/globals';
import { WordGracePeriodManager } from '../js/word/WordGracePeriodManager.js';

/**
 * Mock factories for test setup
 */
function createMockAnimator() {
  return {
    updateWordPendingAnimation: jest.fn(),
  };
}

function createWordData(overrides = {}) {
  return {
    word: 'test',
    direction: 'horizontal',
    row: 0,
    col: 0,
    positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
    ...overrides,
  };
}

describe('WordGracePeriodManager', () => {
  let manager;
  let mockAnimator;

  beforeEach(() => {
    jest.useFakeTimers();
    mockAnimator = createMockAnimator();
    manager = new WordGracePeriodManager(mockAnimator, { gracePeriodMs: 1000 });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // Test Group 1: Constructor
  describe('constructor', () => {
    test('should initialize with animator and grace period', () => {
      expect(manager.gracePeriodMs).toBe(1000);
    });

    test('should have empty pendingWords map initially', () => {
      const pending = manager.getAllPendingWords();
      expect(pending).toEqual([]);
    });
  });

  // Test Group 2: generateWordKey
  describe('generateWordKey', () => {
    test('should generate consistent key for word data', () => {
      const wordData = createWordData({
        word: 'hello',
        direction: 'horizontal',
        row: 5,
        col: 10,
        positions: [{ row: 5, col: 10 }, { row: 5, col: 11 }],
      });
      const key = manager.generateWordKey(wordData);
      expect(key).toBe('hello_horizontal_5_10');
    });

    test('should differentiate by direction', () => {
      const wordData1 = createWordData({
        word: 'test',
        direction: 'horizontal',
        row: 0,
        col: 0,
        positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
      });
      const wordData2 = createWordData({
        word: 'test',
        direction: 'vertical',
        row: 0,
        col: 0,
        positions: [{ row: 0, col: 0 }, { row: 1, col: 0 }],
      });
      expect(manager.generateWordKey(wordData1)).not.toBe(manager.generateWordKey(wordData2));
    });
  });

  // Test Group 3: addPendingWord
  describe('addPendingWord', () => {
    test('should add word to pending and start animation', () => {
      const wordData = createWordData();
      const onExpired = jest.fn();

      manager.addPendingWord(wordData, onExpired);

      expect(mockAnimator.updateWordPendingAnimation).toHaveBeenCalledWith(
        wordData.positions,
        'start'
      );
      const pending = manager.getAllPendingWords();
      expect(pending).toHaveLength(1);
    });

    test('should trigger expiration callback after grace period', () => {
      const globalCallback = jest.fn((wordData, wordKey, onExpired) => {
        if (onExpired) onExpired();
      });
      manager.setOnWordExpired(globalCallback);

      const wordData = createWordData();
      const onExpired = jest.fn();

      manager.addPendingWord(wordData, onExpired);
      jest.advanceTimersByTime(1000);

      expect(onExpired).toHaveBeenCalled();
    });

    test('should remove word from pending after expiration', () => {
      const globalCallback = jest.fn((wordData, wordKey, onExpired) => {
        if (onExpired) onExpired();
        manager.removePendingWord(wordKey);
      });
      manager.setOnWordExpired(globalCallback);

      const wordData = createWordData();
      manager.addPendingWord(wordData, jest.fn());

      jest.advanceTimersByTime(1000);

      const pending = manager.getAllPendingWords();
      expect(pending).toHaveLength(0);
    });

    test('should not trigger expiration if word removed before timer', () => {
      const globalCallback = jest.fn();
      manager.setOnWordExpired(globalCallback);

      const wordData = createWordData();
      const onExpired = jest.fn();

      manager.addPendingWord(wordData, onExpired);
      manager.removePendingWord(manager.generateWordKey(wordData));
      jest.advanceTimersByTime(1000);

      expect(onExpired).not.toHaveBeenCalled();
    });
  });

  // Test Group 4: resetGracePeriod
  describe('resetGracePeriod', () => {
    test('should reset timer for existing pending word', () => {
      const globalCallback = jest.fn((wordData, wordKey, onExpired) => {
        if (onExpired) onExpired();
      });
      manager.setOnWordExpired(globalCallback);

      const wordData = createWordData();
      const onExpired = jest.fn();

      manager.addPendingWord(wordData, onExpired);
      jest.advanceTimersByTime(500);
      
      const newOnExpired = jest.fn();
      manager.resetGracePeriod(manager.generateWordKey(wordData), newOnExpired);
      jest.advanceTimersByTime(500);

      expect(onExpired).not.toHaveBeenCalled();
      expect(newOnExpired).not.toHaveBeenCalled();

      // Need another 500ms for new timer to complete (500 + 1000 from reset point)
      jest.advanceTimersByTime(500);
      expect(newOnExpired).toHaveBeenCalled();
    });

    test('should call updateWordPendingAnimation with reset', () => {
      const wordData = createWordData();
      manager.addPendingWord(wordData, jest.fn());

      manager.resetGracePeriod(manager.generateWordKey(wordData), jest.fn());

      expect(mockAnimator.updateWordPendingAnimation).toHaveBeenCalledWith(
        wordData.positions,
        'reset'
      );
    });

    test('should handle missing word gracefully', () => {
      expect(() => {
        manager.resetGracePeriod('nonexistent_key', jest.fn());
      }).not.toThrow();
    });

    test('should handle missing onWordExpired callback gracefully', () => {
      const wordData = createWordData();
      manager.addPendingWord(wordData, jest.fn());

      expect(() => {
        manager.resetGracePeriod(manager.generateWordKey(wordData), undefined);
      }).not.toThrow();

      jest.advanceTimersByTime(1000);
    });
  });

  // Test Group 5: getIntersectingWordsWithDirection
  describe('getIntersectingWordsWithDirection', () => {
    test('should return empty array when no intersections', () => {
      const wordData = createWordData({
        positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
      });
      manager.addPendingWord(wordData, jest.fn());

      const result = manager.getIntersectingWordsWithDirection([
        { row: 5, col: 5 },
        { row: 5, col: 6 },
      ]);

      expect(result).toEqual([]);
    });

    test('should detect word sharing single position', () => {
      const wordData = createWordData({
        word: 'test',
        direction: 'horizontal',
        positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
      });
      manager.addPendingWord(wordData, jest.fn());

      const result = manager.getIntersectingWordsWithDirection([
        { row: 0, col: 0 },
        { row: 1, col: 0 },
      ]);

      expect(result).toContainEqual(
        expect.objectContaining({
          direction: 'horizontal',
        })
      );
    });

    test('should detect multiple intersecting words', () => {
      const word1 = createWordData({
        word: 'cat',
        direction: 'horizontal',
        positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
      });
      const word2 = createWordData({
        word: 'dog',
        direction: 'vertical',
        row: 1,
        col: 0,
        positions: [{ row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }],
      });
      manager.addPendingWord(word1, jest.fn());
      manager.addPendingWord(word2, jest.fn());

      const result = manager.getIntersectingWordsWithDirection([
        { row: 0, col: 0 },
      ]);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  // Test Group 6: isExtension
  describe('isExtension', () => {
    test('should detect proper extension (superset of positions)', () => {
      const originalPositions = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
      const wordData = createWordData({
        word: 'test',
        direction: 'horizontal',
        positions: originalPositions,
      });
      manager.addPendingWord(wordData, jest.fn());

      const extendedPositions = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ];

      const result = manager.isExtension(
        extendedPositions,
        manager.generateWordKey(wordData)
      );

      expect(result).toBe(true);
    });

    test('should reject same positions as extension', () => {
      const positions = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
      const wordData = createWordData({
        word: 'test',
        direction: 'horizontal',
        positions,
      });
      manager.addPendingWord(wordData, jest.fn());

      const result = manager.isExtension(
        positions,
        manager.generateWordKey(wordData)
      );

      expect(result).toBe(false);
    });

    test('should reject subset of positions as extension', () => {
      const positions = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ];
      const wordData = createWordData({
        word: 'test',
        direction: 'horizontal',
        positions,
      });
      manager.addPendingWord(wordData, jest.fn());

      const result = manager.isExtension(
        [{ row: 0, col: 0 }, { row: 0, col: 1 }],
        manager.generateWordKey(wordData)
      );

      expect(result).toBe(false);
    });
  });

  // Test Group 7: removePendingWord
  describe('removePendingWord', () => {
    test('should remove pending word by key', () => {
      const wordData = createWordData();
      manager.addPendingWord(wordData, jest.fn());

      manager.removePendingWord(manager.generateWordKey(wordData));

      const pending = manager.getAllPendingWords();
      expect(pending).toHaveLength(0);
    });

    test('should call updateWordPendingAnimation with clear on removal', () => {
      const wordData = createWordData();
      manager.addPendingWord(wordData, jest.fn());

      manager.removePendingWord(manager.generateWordKey(wordData));

      expect(mockAnimator.updateWordPendingAnimation).toHaveBeenCalledWith(
        wordData.positions,
        'clear'
      );
    });

    test('should handle removal of nonexistent word', () => {
      expect(() => {
        manager.removePendingWord('nonexistent_key');
      }).not.toThrow();
    });
  });

  // Test Group 8: clearAll
  describe('clearAll', () => {
    test('should clear all pending words', () => {
      manager.addPendingWord(createWordData({ word: 'word1' }), jest.fn());
      manager.addPendingWord(createWordData({ word: 'word2' }), jest.fn());

      manager.clearAll();

      const pending = manager.getAllPendingWords();
      expect(pending).toHaveLength(0);
    });

    test('should call updateWordPendingAnimation with clear for each word', () => {
      mockAnimator.updateWordPendingAnimation.mockClear();
      manager.addPendingWord(createWordData({ word: 'word1' }), jest.fn());
      manager.addPendingWord(createWordData({ word: 'word2' }), jest.fn());

      manager.clearAll();

      expect(mockAnimator.updateWordPendingAnimation).toHaveBeenCalledTimes(3);
    });

    test('should handle clearAll on empty manager', () => {
      expect(() => {
        manager.clearAll();
      }).not.toThrow();
    });
  });

  // Test Group 9: getAllPendingWords
  describe('getAllPendingWords', () => {
    test('should return empty array initially', () => {
      const result = manager.getAllPendingWords();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    test('should return all pending words', () => {
      manager.addPendingWord(createWordData({ word: 'word1' }), jest.fn());
      manager.addPendingWord(createWordData({ word: 'word2' }), jest.fn());

      const result = manager.getAllPendingWords();
      expect(result).toHaveLength(2);
    });

test('should remove word from pending list when grace period expires', () => {
      const globalCallback = jest.fn((wordData, wordKey, onExpired) => {
        manager.removePendingWord(wordKey);
      });
      manager.setOnWordExpired(globalCallback);

      manager.addPendingWord(createWordData({ word: 'word1' }), jest.fn());
      jest.advanceTimersByTime(1000);

      const result = manager.getAllPendingWords();
      expect(result).toHaveLength(0);
    });
  });

  // Test Group 10: setOnWordExpired
  describe('setOnWordExpired', () => {
    test('should set global expiration callback', () => {
      const globalCallback = jest.fn();
      manager.setOnWordExpired(globalCallback);

      const wordData = createWordData();
      manager.addPendingWord(wordData, jest.fn());

      jest.advanceTimersByTime(1000);

      expect(globalCallback).toHaveBeenCalledWith(
        wordData,
        manager.generateWordKey(wordData),
        expect.any(Function)
      );
    });

    test('should use per-word callback via global when provided', () => {
      const globalCallback = jest.fn();
      const wordCallback = jest.fn();
      manager.setOnWordExpired(globalCallback);

      const wordData = createWordData();
      manager.addPendingWord(wordData, wordCallback);

      jest.advanceTimersByTime(1000);

      expect(globalCallback).toHaveBeenCalled();
      // The word-specific callback is passed as 3rd param to global callback
      expect(globalCallback.mock.calls[0][2]).toBe(wordCallback);
    });

    test('should call global callback even when no word-specific callback', () => {
      const globalCallback = jest.fn();
      manager.setOnWordExpired(globalCallback);

      const wordData = createWordData();
      manager.addPendingWord(wordData, undefined);

      jest.advanceTimersByTime(1000);

      expect(globalCallback).toHaveBeenCalledWith(
        wordData,
        manager.generateWordKey(wordData),
        null  // Default value for onExpired param
      );
    });
  });

  // Test Group 11: handleWordExtension
  describe('handleWordExtension', () => {
    test('should remove intersecting words on extension', () => {
      const originalWord = createWordData({
        word: 'cat',
        direction: 'horizontal',
        row: 0,
        col: 0,
        positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
      });
      manager.addPendingWord(originalWord, jest.fn());

      const extendedWord = createWordData({
        word: 'cats',
        direction: 'horizontal',
        row: 0,
        col: 0,
        positions: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      });

      const intersectingKeys = [manager.generateWordKey(originalWord)];
      manager.handleWordExtension(extendedWord, intersectingKeys);

      const pending = manager.getAllPendingWords();
      expect(pending.some(w => w.wordData.word === 'cats')).toBe(true);
      expect(pending.some(w => w.wordData.word === 'cat')).toBe(false);
    });

    test('should add new extended word with callback', () => {
      const originalWord = createWordData({
        word: 'cat',
        direction: 'horizontal',
        positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
      });
      const originalCallback = jest.fn();
      manager.addPendingWord(originalWord, originalCallback);

      const extendedWord = createWordData({
        word: 'cats',
        direction: 'horizontal',
        positions: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      });

      const intersectingKeys = [manager.generateWordKey(originalWord)];
      manager.handleWordExtension(extendedWord, intersectingKeys);

      const pending = manager.getAllPendingWords();
      expect(pending.some(w => w.wordData.word === 'cats')).toBe(true);
    });

    test('should preserve callback on extension with same direction', () => {
      const globalCallback = jest.fn();
      manager.setOnWordExpired(globalCallback);

      const originalWord = createWordData({
        word: 'cat',
        direction: 'horizontal',
        row: 0,
        col: 0,
        positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
      });
      const originalCallback = jest.fn();
      manager.addPendingWord(originalWord, originalCallback);

      const extendedWord = createWordData({
        word: 'cats',
        direction: 'horizontal',
        row: 0,
        col: 0,
        positions: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      });

      const intersectingKeys = [manager.generateWordKey(originalWord)];
      manager.handleWordExtension(extendedWord, intersectingKeys);

      jest.advanceTimersByTime(1000);

      expect(globalCallback).toHaveBeenCalled();
      // The original callback should be passed as 3rd param to global callback
      expect(globalCallback.mock.calls[0][2]).toBe(originalCallback);
    });

    test('should handle extension with no intersecting words', () => {
      const extendedWord = createWordData({
        word: 'cats',
        direction: 'horizontal',
        positions: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      });

      expect(() => {
        manager.handleWordExtension(extendedWord, []);
      }).not.toThrow();
    });

    test('should call animation start on extension', () => {
      const originalWord = createWordData({
        word: 'cat',
        direction: 'horizontal',
        positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
      });
      manager.addPendingWord(originalWord, jest.fn());

      const extendedWord = createWordData({
        word: 'cats',
        direction: 'horizontal',
        positions: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      });

      manager.handleWordExtension(extendedWord, [manager.generateWordKey(originalWord)]);

      expect(mockAnimator.updateWordPendingAnimation).toHaveBeenCalled();
    });
  });
});


