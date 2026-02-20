import { jest } from '@jest/globals';
import { WordProcessor } from '../js/core/WordProcessor.js';
import { WordGracePeriodManager } from '../js/word/WordGracePeriodManager.js';

function createMockAnimator() {
  return {
    updateWordPendingAnimation: jest.fn(),
  };
}

/**
 * Minimal game mock — only what WordProcessor needs for construction
 * and _handleSingleWordGracePeriod (state.gameMode + tutorialUIState).
 */
function createMockGame() {
  return {
    state: { gameMode: 'classic', scoringEnabled: true },
    wordResolver: { checkForWords: jest.fn().mockReturnValue([]) },
    tutorialUIState: null,
  };
}

function makeWordData(word, positions, direction = 'horizontal') {
  return { word, positions, direction, definition: `Definition of ${word}` };
}

describe('WordProcessor._handleSingleWordGracePeriod', () => {
  let processor;
  let manager;
  let mockAnimator;

  beforeEach(() => {
    jest.useFakeTimers();
    mockAnimator = createMockAnimator();
    manager = new WordGracePeriodManager(mockAnimator, { gracePeriodMs: 1000 });
    processor = new WordProcessor(createMockGame(), manager);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // ─── Partial same-direction overlap ───────────────────────────────────────

  describe('partial same-direction overlap (e.g. HASS → HAS and ASS)', () => {
    test('BUG: when HAS is pending, ASS (partial overlap, same direction) should NOT also be added', () => {
      // H-A-S-S on the grid: HAS lives at cols 0-2, ASS at cols 1-3.
      // They share cols 1 and 2, so only one word per direction should pend.
      const has = makeWordData('HAS', [
        { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
      ]);
      const ass = makeWordData('ASS', [
        { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
      ]);

      // First checkForWords scan detects HAS
      processor._handleSingleWordGracePeriod(has);
      // Second scan (after another tile lands) also detects ASS
      processor._handleSingleWordGracePeriod(ass);

      const pending = manager.getAllPendingWords();
      // EXPECTED (fix not yet applied): 1 pending word
      // ACTUAL (current bug):           2 pending words — both HAS and ASS clear
      expect(pending.length).toBe(1);
    });
  });

  // ─── Extension: HAS → HASH ────────────────────────────────────────────────

  describe('extension: HAS pending, then HASH detected', () => {
    test('when HASH extends HAS, only HASH should remain pending', () => {
      const has = makeWordData('HAS', [
        { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
      ]);
      const hash = makeWordData('HASH', [
        { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
      ]);

      processor._handleSingleWordGracePeriod(has);
      processor._handleSingleWordGracePeriod(hash);

      const pending = manager.getAllPendingWords();
      expect(pending.length).toBe(1);
      expect(pending[0].wordData.word).toBe('HASH');
    });

    test('when HASH extends HAS, the grace period timer resets from the extension point', () => {
      const globalCallback = jest.fn();
      manager.setOnWordExpired(globalCallback);

      const has = makeWordData('HAS', [
        { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
      ]);
      const hash = makeWordData('HASH', [
        { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
      ]);

      processor._handleSingleWordGracePeriod(has);
      jest.advanceTimersByTime(800); // HAS is 200ms from expiry

      processor._handleSingleWordGracePeriod(hash); // Should replace HAS with a fresh timer

      jest.advanceTimersByTime(800); // 800ms after extension — HAS would have expired, but HASH shouldn't yet
      expect(globalCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300); // Now 1100ms after extension — HASH should expire
      expect(globalCallback).toHaveBeenCalledTimes(1);
      expect(globalCallback.mock.calls[0][0].word).toBe('HASH');
    });
  });
});
