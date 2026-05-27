import { GRID_COLS, GRID_ROWS } from './gameConstants.js';

/**
 * Compute drop-overlay coordinates relative to a container element.
 *
 * Uses the container's own offsetWidth/getBoundingClientRect ratio to derive
 * the CSS↔visual-pixel scale factor, so the result is correct under any zoom
 * mechanism (CSS zoom, browser pinch-zoom, transform:scale).
 */
export function computeDropCoords(containerEl, fromEl, gridEl, col, destRow) {
  const containerRect = containerEl.getBoundingClientRect();
  const fromRect = fromEl.getBoundingClientRect();
  const gridRect = gridEl.getBoundingClientRect();

  // CSS pixels per visual pixel — derived from the container itself,
  // not from document.documentElement.zoom, so it handles any zoom source.
  const scale = containerEl.offsetWidth / containerRect.width;

  const colW = gridRect.width / GRID_COLS;
  const rowH = gridRect.height / GRID_ROWS;
  const cellSize = Math.min(colW, rowH) * scale;

  // Center the tile within the column (when cells are square in a wider column).
  const colLeft = gridRect.left + col * colW + (colW - Math.min(colW, rowH)) / 2;

  const rx = (v) => (v - containerRect.left) * scale;
  const ry = (v) => (v - containerRect.top) * scale;

  return {
    from:    { x: rx(fromRect.left), y: ry(fromRect.top) },
    toTop:   { x: rx(colLeft),       y: ry(gridRect.top) },
    toFinal: { x: rx(colLeft),       y: ry(gridRect.top + destRow * rowH) },
    cellSize,
  };
}
