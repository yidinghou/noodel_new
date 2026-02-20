import { gameReducer, initialState } from '../context/GameReducer.js';
import { GRID_COLS, GRID_SIZE } from '../utils/gameConstants.js';

// Helpers
function emptyGrid() {
  return Array(GRID_SIZE).fill(null);
}

function cell(char, overrides = {}) {
  return { char, id: `tile-${char}`, type: 'filled', isMatched: false, isPending: false, ...overrides };
}

function idx(row, col) {
  return row * GRID_COLS + col;
}

function playingState(gridOverrides = {}) {
  const grid = emptyGrid();
  Object.entries(gridOverrides).forEach(([index, char]) => {
    grid[Number(index)] = cell(char);
  });
  return { ...initialState, status: 'PLAYING', grid };
}

// Build a wordData object as useGameLogic produces it
function wordData(word, indices, direction = 'horizontal') {
  return { word, indices, direction, startRow: 0, startCol: 0 };
}

// ─── REMOVE_WORDS ────────────────────────────────────────────────────────────

describe('gameReducer – REMOVE_WORDS', () => {
  test('clears the specified indices from the grid', () => {
    const state = playingState({
      [idx(5, 0)]: 'C', [idx(5, 1)]: 'A', [idx(5, 2)]: 'T',
    });

    const next = gameReducer(state, {
      type: 'REMOVE_WORDS',
      payload: { wordsToRemove: [wordData('CAT', [idx(5,0), idx(5,1), idx(5,2)])] },
    });

    expect(next.grid[idx(5, 0)]).toBeNull();
    expect(next.grid[idx(5, 1)]).toBeNull();
    expect(next.grid[idx(5, 2)]).toBeNull();
  });

  test('leaves unrelated tiles untouched', () => {
    const state = playingState({
      [idx(5, 0)]: 'C', [idx(5, 1)]: 'A', [idx(5, 2)]: 'T',
      [idx(5, 5)]: 'X',
    });

    const next = gameReducer(state, {
      type: 'REMOVE_WORDS',
      payload: { wordsToRemove: [wordData('CAT', [idx(5,0), idx(5,1), idx(5,2)])] },
    });

    expect(next.grid[idx(5, 5)]).not.toBeNull();
    expect(next.grid[idx(5, 5)].char).toBe('X');
  });

  test('increases score by the word\'s point value', () => {
    const state = playingState({
      [idx(5, 0)]: 'C', [idx(5, 1)]: 'A', [idx(5, 2)]: 'T',
    });

    const next = gameReducer(state, {
      type: 'REMOVE_WORDS',
      payload: { wordsToRemove: [wordData('CAT', [idx(5,0), idx(5,1), idx(5,2)])] },
    });

    expect(next.score).toBeGreaterThan(0);
  });

  test('adds each cleared word to madeWords', () => {
    const state = playingState({
      [idx(5, 0)]: 'C', [idx(5, 1)]: 'A', [idx(5, 2)]: 'T',
    });

    const next = gameReducer(state, {
      type: 'REMOVE_WORDS',
      payload: { wordsToRemove: [wordData('CAT', [idx(5,0), idx(5,1), idx(5,2)])] },
    });

    expect(next.madeWords).toContain('CAT');
  });

  test('clears multiple words in a single dispatch', () => {
    const state = playingState({
      [idx(5, 0)]: 'C', [idx(5, 1)]: 'A', [idx(5, 2)]: 'T',
      [idx(3, 6)]: 'D', [idx(4, 6)]: 'O', [idx(5, 6)]: 'G',
    });

    const next = gameReducer(state, {
      type: 'REMOVE_WORDS',
      payload: {
        wordsToRemove: [
          wordData('CAT', [idx(5,0), idx(5,1), idx(5,2)]),
          wordData('DOG', [idx(3,6), idx(4,6), idx(5,6)], 'vertical'),
        ],
      },
    });

    [idx(5,0), idx(5,1), idx(5,2), idx(3,6), idx(4,6), idx(5,6)].forEach(i => {
      expect(next.grid[i]).toBeNull();
    });
    expect(next.madeWords).toContain('CAT');
    expect(next.madeWords).toContain('DOG');
  });

  test('transitions status back to PLAYING', () => {
    const state = { ...playingState(), status: 'PROCESSING' };

    const next = gameReducer(state, {
      type: 'REMOVE_WORDS',
      payload: { wordsToRemove: [] },
    });

    expect(next.status).toBe('PLAYING');
  });
});

// ─── SET_PENDING / CLEAR_PENDING / SET_MATCHED_INDICES ───────────────────────

describe('gameReducer – pending and matched cell state', () => {
  test('SET_PENDING marks cells as isPending', () => {
    const state = playingState({
      [idx(5, 0)]: 'C', [idx(5, 1)]: 'A', [idx(5, 2)]: 'T',
    });

    const next = gameReducer(state, {
      type: 'SET_PENDING',
      payload: { indices: [idx(5,0), idx(5,1), idx(5,2)] },
    });

    [idx(5,0), idx(5,1), idx(5,2)].forEach(i => {
      expect(next.grid[i].isPending).toBe(true);
    });
    expect(next.status).toBe('PLAYING'); // does not change status
  });

  test('CLEAR_PENDING removes isPending from cells', () => {
    const state = {
      ...playingState({
        [idx(5, 0)]: 'C', [idx(5, 1)]: 'A', [idx(5, 2)]: 'T',
      }),
    };
    // First mark pending
    const withPending = gameReducer(state, {
      type: 'SET_PENDING',
      payload: { indices: [idx(5,0), idx(5,1), idx(5,2)] },
    });

    const cleared = gameReducer(withPending, {
      type: 'CLEAR_PENDING',
      payload: { indices: [idx(5,0), idx(5,1), idx(5,2)] },
    });

    [idx(5,0), idx(5,1), idx(5,2)].forEach(i => {
      expect(cleared.grid[i].isPending).toBe(false);
    });
  });

  test('SET_MATCHED_INDICES marks cells as isMatched and sets status to PROCESSING', () => {
    const state = playingState({
      [idx(5, 0)]: 'C', [idx(5, 1)]: 'A', [idx(5, 2)]: 'T',
    });

    const next = gameReducer(state, {
      type: 'SET_MATCHED_INDICES',
      payload: { indices: [idx(5,0), idx(5,1), idx(5,2)] },
    });

    [idx(5,0), idx(5,1), idx(5,2)].forEach(i => {
      expect(next.grid[i].isMatched).toBe(true);
      expect(next.grid[i].isPending).toBe(false);
    });
    expect(next.status).toBe('PROCESSING');
  });

  test('DROP_LETTER is still accepted while status is PROCESSING', () => {
    const state = {
      ...playingState({ [idx(5, 0)]: 'C', [idx(5, 1)]: 'A', [idx(5, 2)]: 'T' }),
      status: 'PROCESSING',
      nextQueue: [{ char: 'S', id: 'tile-100', type: 'letter' }],
    };

    const next = gameReducer(state, { type: 'DROP_LETTER', payload: { column: 3 } });

    expect(next.grid[idx(5, 3)]).not.toBeNull();
    expect(next.grid[idx(5, 3)].char).toBe('S');
  });
});
