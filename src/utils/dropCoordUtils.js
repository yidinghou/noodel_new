import { GRID_COLS, GRID_ROWS } from './gameConstants.js';

/**
 * Compute drop-overlay coordinates relative to a container element.
 *
 * Uses the container's own offsetWidth/getBoundingClientRect ratio to derive
 * the CSS↔visual-pixel scale factor, so the result is correct under any zoom
 * mechanism (CSS zoom, browser pinch-zoom, transform:scale).
 *
 * Measures actual cell dimensions from the grid's first children so the overlay
 * matches grids that have internal padding or gaps (e.g. the game board).
 */
export function computeDropCoords(containerEl, fromEl, gridEl, col, destRow) {
  const containerRect = containerEl.getBoundingClientRect();
  const fromRect = fromEl.getBoundingClientRect();
  const gridRect = gridEl.getBoundingClientRect();

  // CSS pixels per visual pixel — derived from the container itself,
  // not from document.documentElement.zoom, so it handles any zoom source.
  const scale = containerEl.offsetWidth / containerRect.width;

  const c0 = gridEl.firstElementChild?.getBoundingClientRect();
  const c1 = gridEl.children[1]?.getBoundingClientRect();
  const r1 = gridEl.children[GRID_COLS]?.getBoundingClientRect();

  let cellSize, colLeft, rowTop;

  if (c0 && c1 && r1) {
    // Measure actual cell size and pitch from the DOM — works regardless of
    // internal padding or gap between cells.
    const colPitch = c1.left - c0.left;
    const rowPitch = r1.top - c0.top;
    cellSize = Math.min(c0.width, c0.height) * scale;
    colLeft = c0.left + col * colPitch;
    rowTop = c0.top + destRow * rowPitch;
  } else {
    // Fallback for grids with fewer than GRID_COLS+1 cells (e.g. ambient demo).
    const colW = gridRect.width / GRID_COLS;
    const rowH = gridRect.height / GRID_ROWS;
    cellSize = Math.min(colW, rowH) * scale;
    colLeft = gridRect.left + col * colW + (colW - Math.min(colW, rowH)) / 2;
    rowTop = gridRect.top + destRow * rowH;
  }

  const rx = (v) => (v - containerRect.left) * scale;
  const ry = (v) => (v - containerRect.top) * scale;

  return {
    from:    { x: rx(fromRect.left), y: ry(fromRect.top) },
    toTop:   { x: rx(colLeft),       y: ry(gridRect.top) },
    toFinal: { x: rx(colLeft),       y: ry(rowTop) },
    cellSize,
  };
}
