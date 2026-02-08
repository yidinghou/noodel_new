import WordGracePeriodManager from '../js/word/WordGracePeriodManager.js';

/**
 * Mock factories for test setup
 */
function createMockAnimator() {
  return {
    startWordPendingAnimation: jest.fn(),
    resetWordPendingAnimation: jest.fn(),
    clearWordPendingAnimation: jest.fn(),
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
    manager = new WordGracePeriodManager(mockAnimator, 1000);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
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
      });
      const wordData2 = createWordData({
        word: 'test',
        direction: 'vertical',
        row: 0,
        col: 0,
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

      expect(mockAnimator.startWordPendingAnimation).toHaveBeenCalledWith(
        manager.generateWordKey(wordData),
        wordData
      );
      const pending = manager.getAllPendingWords();
      expect(pending).toHaveLength(1);
    });

    test('should trigger expiration callback after grace period', () => {
      const wordData = createWordData();
      const onExpired = jest.fn();

      manager.addPendingWord(wordData, onExpired);
      jest.advanceTimersByTime(1000);

      expect(onExpired).toHaveBeenCalledWith(manager.generateWordKey(wordData));
    });

    test('should remove word from pending after expiration', () => {
      const wordData = createWordData();
      manager.addPendingWord(wordData, jest.fn());

      jest.advanceTimersByTime(1000);

      const pending = manager.getAllPendingWords();
      expect(pending).toHaveLength(0);
    });

    test('should not trigger expiration if word removed before timer', () => {
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
      const wordData = createWordData();
      const onExpired = jest.fn();

      manager.addPendingWord(wordData, onExpired);
      jest.advanceTimersByTime(500);
      
      const newOnExpired = jest.fn();
      manager.resetGracePeriod(manager.generateWordKey(wordData), newOnExpired);
      jest.advanceTimersByTime(500);

      expect(onExpired).not.toHaveBeenCalled();
      expect(newOnExpired).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(newOnExpired).toHaveBeenCalled();
    });

    test('should call resetWordPendingAnimation', () => {
      const wordData = createWordData();
      manager.addPendingWord(wordData, jest.fn());

      manager.resetGracePeriod(manager.generateWordKey(wordData), jest.fn());

      expect(mockAnimator.resetWordPendingAnimation).toHaveBeenCalled();
    });

    test('should handle missing word gracefully', () => {
      expect(() => {
        manager.resetGracePeriod('nonexistent_key', jest.fn());
      }).not.toThrow();
    });

    test('should handle missing onWordExpired callback', () => {
      const wordData = createWordData();
      manager.addPendingWord(wordData, jest.fn());

      expect(() => {
        manager.resetGracePeriod(manager.generateWordKey(wordData), undefined);
      }).not.toThrow();

      jest.advanceTimersByTime(1000);
    });
  });
});
