import {
  generateWordKey,
  isExtension,
  hasIntersection,
  classifyIncomingWord,
} from '../utils/gracePeriodUtils.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function word(w, indices, direction = 'horizontal', startRow = 0, startCol = 0) {
  return { word: w, indices, direction, startRow, startCol };
}

// Build a pendingView Map as classifyIncomingWord expects:
// Map<wordKey, { direction, idxSet }>
function pendingView(...entries) {
  const map = new Map();
  for (const { key, direction, indices } of entries) {
    map.set(key, { direction, idxSet: new Set(indices) });
  }
  return map;
}

// ─── generateWordKey ──────────────────────────────────────────────────────────

describe('generateWordKey', () => {
  test('produces a stable key from word fields', () => {
    expect(generateWordKey(word('CAT', [0, 1, 2]))).toBe('CAT_horizontal_0_0');
  });

  test('different directions produce different keys for same word', () => {
    const h = generateWordKey(word('CAT', [0, 1, 2], 'horizontal', 0, 0));
    const v = generateWordKey(word('CAT', [0, 7, 14], 'vertical', 0, 0));
    expect(h).not.toBe(v);
  });

  test('different start positions produce different keys', () => {
    const a = generateWordKey(word('CAT', [0, 1, 2], 'horizontal', 0, 0));
    const b = generateWordKey(word('CAT', [7, 8, 9], 'horizontal', 1, 0));
    expect(a).not.toBe(b);
  });
});

// ─── isExtension ──────────────────────────────────────────────────────────────

describe('isExtension', () => {
  test('returns true when new set is a strict superset', () => {
    expect(isExtension(new Set([0, 1, 2, 3]), new Set([0, 1, 2]))).toBe(true);
  });

  test('returns false for equal sets', () => {
    expect(isExtension(new Set([0, 1, 2]), new Set([0, 1, 2]))).toBe(false);
  });

  test('returns false when new set is smaller', () => {
    expect(isExtension(new Set([0, 1]), new Set([0, 1, 2]))).toBe(false);
  });

  test('returns false when new set is larger but does not contain all old indices', () => {
    expect(isExtension(new Set([1, 2, 3, 4]), new Set([0, 1, 2]))).toBe(false);
  });
});

// ─── hasIntersection ─────────────────────────────────────────────────────────

describe('hasIntersection', () => {
  test('returns true when sets share one index', () => {
    expect(hasIntersection(new Set([0, 1, 2]), new Set([2, 3, 4]))).toBe(true);
  });

  test('returns false for disjoint sets', () => {
    expect(hasIntersection(new Set([0, 1, 2]), new Set([3, 4, 5]))).toBe(false);
  });

  test('returns false for empty sets', () => {
    expect(hasIntersection(new Set(), new Set([0, 1, 2]))).toBe(false);
  });
});

// ─── classifyIncomingWord ─────────────────────────────────────────────────────

describe('classifyIncomingWord', () => {

  describe('skip', () => {
    test('returns skip when the same word key is already pending', () => {
      const w = word('CAT', [0, 1, 2]);
      const key = generateWordKey(w);
      const pending = pendingView({ key, direction: 'horizontal', indices: [0, 1, 2] });

      expect(classifyIncomingWord(w, pending)).toEqual({ type: 'skip' });
    });
  });

  describe('extend', () => {
    test('returns extend when new word is a strict superset in the same direction', () => {
      const cat = word('CAT', [0, 1, 2]);
      const cats = word('CATS', [0, 1, 2, 3]);
      const catKey = generateWordKey(cat);
      const pending = pendingView({ key: catKey, direction: 'horizontal', indices: [0, 1, 2] });

      const result = classifyIncomingWord(cats, pending);

      expect(result.type).toBe('extend');
      expect(result.replaceKey).toBe(catKey);
    });

    test('does not extend when directions differ', () => {
      // Same cell indices but different direction — not an extension
      const cat = word('CAT', [0, 1, 2], 'horizontal');
      const catV = word('CAT', [0, 7, 14], 'vertical');
      const catKey = generateWordKey(cat);
      const pending = pendingView({ key: catKey, direction: 'horizontal', indices: [0, 1, 2] });

      const result = classifyIncomingWord(catV, pending);

      expect(result.type).not.toBe('extend');
    });
  });

  describe('add – no intersections', () => {
    test('returns add with empty resetKeys when no pending words share cells', () => {
      const cat = word('CAT', [0, 1, 2]);
      const catKey = generateWordKey(cat);
      const pending = pendingView({ key: catKey, direction: 'horizontal', indices: [0, 1, 2] });

      // DOG in a completely separate row/col
      const dog = word('DOG', [14, 15, 16]);
      const result = classifyIncomingWord(dog, pending);

      expect(result.type).toBe('add');
      expect(result.resetKeys).toEqual([]);
    });

    test('returns add with empty resetKeys on an empty pending map', () => {
      const result = classifyIncomingWord(word('CAT', [0, 1, 2]), new Map());
      expect(result.type).toBe('add');
      expect(result.resetKeys).toEqual([]);
    });
  });

  describe('add – timer reset group', () => {
    test('includes a cross-direction pending word in resetKeys when they share a cell', () => {
      // CAT horizontal at indices 3,4,5 — pending
      // New word ACE vertical at indices 5,12,19 — shares index 5 with CAT
      const cat = word('CAT', [3, 4, 5], 'horizontal', 0, 3);
      const catKey = generateWordKey(cat);
      const pending = pendingView({ key: catKey, direction: 'horizontal', indices: [3, 4, 5] });

      const ace = word('ACE', [5, 12, 19], 'vertical', 0, 5);
      const result = classifyIncomingWord(ace, pending);

      expect(result.type).toBe('add');
      expect(result.resetKeys).toContain(catKey);
    });

    test('ALL intersecting pending words appear in resetKeys', () => {
      // CAT horizontal at [3,4,5] and DOG vertical at [5,12,19] are both pending.
      // They share index 5 with each other and with a new incoming word.
      const cat = word('CAT', [3, 4, 5], 'horizontal', 0, 3);
      const dog = word('DOG', [5, 12, 19], 'vertical', 0, 5);
      const catKey = generateWordKey(cat);
      const dogKey = generateWordKey(dog);
      const pending = pendingView(
        { key: catKey, direction: 'horizontal', indices: [3, 4, 5] },
        { key: dogKey, direction: 'vertical',   indices: [5, 12, 19] }
      );

      // New diagonal word that touches index 5 — should reset both CAT and DOG
      const run = word('RUN', [5, 10, 15], 'diagonal-down-right', 0, 5);
      const result = classifyIncomingWord(run, pending);

      expect(result.type).toBe('add');
      expect(result.resetKeys).toContain(catKey);
      expect(result.resetKeys).toContain(dogKey);
      expect(result.resetKeys).toHaveLength(2);
    });

    test('only directly intersecting words are in resetKeys — not transitive ones', () => {
      // CAT at [0,1,2] and DOG at [2,9,16] share index 2 — both pending.
      // New word FOX at [16,17,18] shares index 16 with DOG but NOT with CAT.
      const cat = word('CAT', [0, 1, 2], 'horizontal', 0, 0);
      const dog = word('DOG', [2, 9, 16], 'vertical', 0, 2);
      const catKey = generateWordKey(cat);
      const dogKey = generateWordKey(dog);
      const pending = pendingView(
        { key: catKey, direction: 'horizontal', indices: [0, 1, 2] },
        { key: dogKey, direction: 'vertical',   indices: [2, 9, 16] }
      );

      const fox = word('FOX', [16, 17, 18], 'horizontal', 2, 2);
      const result = classifyIncomingWord(fox, pending);

      expect(result.type).toBe('add');
      expect(result.resetKeys).toContain(dogKey);   // DOG shares index 16
      expect(result.resetKeys).not.toContain(catKey); // CAT does not share any index
    });
  });
});
