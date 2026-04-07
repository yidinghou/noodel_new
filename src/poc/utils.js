import { ROWS, COLS } from './constants.js';

export function emptyGrid() {
  return Array(ROWS * COLS).fill(null);
}

export function destRow(grid, col) {
  for (let r = ROWS - 1; r >= 0; r--)
    if (!grid[r * COLS + col]) return r;
  return -1;
}

export function sleep(ms, signal) {
  return new Promise((res, rej) => {
    if (signal.aborted) return rej(new DOMException('Aborted', 'AbortError'));
    const id = setTimeout(res, ms);
    signal.addEventListener('abort', () => { clearTimeout(id); rej(new DOMException('Aborted', 'AbortError')); }, { once: true });
  });
}
