import { useEffect, useRef, useState } from 'react';
import { GRID_COLS as COLS, GRID_ROWS as ROWS } from '../utils/gameConstants.js';

const DROP_SPEED_CELLS_PER_SEC = 14;

const SCRIPT = [
  { type: 'drop',  col: 1, letter: 'C' },
  { type: 'drop',  col: 2, letter: 'A' },
  { type: 'drop',  col: 3, letter: 'T' },
  { type: 'clear', indices: [5 * COLS + 1, 5 * COLS + 2, 5 * COLS + 3] },
  { type: 'drop',  col: 5, letter: 'G' },
  { type: 'drop',  col: 5, letter: 'O' },
  { type: 'drop',  col: 5, letter: 'D' },
  { type: 'clear', indices: [3 * COLS + 5, 4 * COLS + 5, 5 * COLS + 5] },
  { type: 'drop',  col: 0, letter: 'W' },
  { type: 'drop',  col: 1, letter: 'I' },
  { type: 'drop',  col: 2, letter: 'N' },
  { type: 'clear', indices: [5 * COLS + 0, 5 * COLS + 1, 5 * COLS + 2] },
];

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('aborted', 'AbortError'));
    });
  });

const emptyGrid = () => Array(COLS * ROWS).fill(null);

const destRow = (grid, col) => {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!grid[r * COLS + col]) return r;
  }
  return -1;
};

const applyGravity = (grid) => {
  const g = [...grid];
  for (let c = 0; c < COLS; c++) {
    const tiles = [];
    for (let r = 0; r < ROWS; r++) {
      const v = g[r * COLS + c];
      if (v) tiles.push(v);
    }
    for (let r = 0; r < ROWS; r++) {
      const offset = r - (ROWS - tiles.length);
      g[r * COLS + c] = offset >= 0 ? tiles[offset] : null;
    }
  }
  return g;
};

const computeQueue = (from, n) => {
  const out = [];
  for (let i = 0; out.length < n && i < SCRIPT.length * 2; i++) {
    const step = SCRIPT[(from + i) % SCRIPT.length];
    if (step.type === 'drop') out.push(step.letter);
  }
  return out;
};

export function useAmbientDemo() {
  const [state, setState] = useState({
    grid: emptyGrid(),
    dropping: null,
    highlight: null,
    scriptIndex: 0,
  });
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;
    const wait = (ms) => sleep(ms, signal);
    const set = (fn) => { if (!signal.aborted) setState(fn); };

    async function dropLetter(col, letter) {
      const dr = destRow(ref.current.grid, col);
      if (dr < 0) return;

      set((s) => ({
        ...s,
        dropping: { letter, col, destRow: dr, phase: 'top' },
        scriptIndex: (s.scriptIndex + 1) % SCRIPT.length,
      }));
      await wait(220);

      set((s) => s.dropping ? { ...s, dropping: { ...s.dropping, phase: 'falling' } } : s);
      const dropMs = Math.max(120, ((dr + 1) / DROP_SPEED_CELLS_PER_SEC) * 1000);
      await wait(dropMs + 40);

      set((s) => {
        const grid = [...s.grid];
        grid[dr * COLS + col] = letter;
        return { ...s, grid, dropping: null };
      });
      await wait(140);
    }

    async function highlightWord(indices) {
      set((s) => ({ ...s, highlight: new Set(indices), scriptIndex: (s.scriptIndex + 1) % SCRIPT.length }));
      await wait(900);
      set((s) => {
        const grid = [...s.grid];
        indices.forEach((i) => { grid[i] = null; });
        return { ...s, grid: applyGravity(grid), highlight: null };
      });
      await wait(320);
    }

    async function loop() {
      while (!signal.aborted) {
        set(() => ({ grid: emptyGrid(), dropping: null, highlight: null, scriptIndex: 0 }));
        await wait(500);

        for (let i = 0; i < SCRIPT.length && !signal.aborted; i++) {
          const step = SCRIPT[i];
          if (step.type === 'drop') {
            await dropLetter(step.col, step.letter);
          } else if (step.type === 'clear') {
            await highlightWord(step.indices);
            await wait(400);
          }
        }
        await wait(700);
      }
    }

    loop().catch((e) => {
      if (e.name !== 'AbortError') console.error(e);
    });
    return () => ac.abort();
  }, []);

  const queue = computeQueue(state.scriptIndex, 5);
  return { grid: state.grid, dropping: state.dropping, highlight: state.highlight, queue };
}

export default useAmbientDemo;
