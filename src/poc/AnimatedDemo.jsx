import { useState, useEffect, useRef } from 'react';
import { COLS, ROWS, CELL, STEP, GRID_W } from './constants.js';
import { emptyGrid, destRow, sleep } from './utils.js';

const PREVIEW_SIZE = 5;
const PCELL = 36;
const PREVIEW_GAP = 5;
const CURSOR_ROW_H = 22;
const WRAPPER_GAP = 8;
const DROP_SPEED = 20; // cells per second

// First preview cell center → dropping tile top-left, relative to grid container
const PREVIEW_ROW_W = PREVIEW_SIZE * PCELL + (PREVIEW_SIZE - 1) * PREVIEW_GAP;
const PREVIEW_LEFT = (GRID_W - PREVIEW_ROW_W) / 2 + PCELL / 2 - CELL / 2;
const PREVIEW_TOP = -(CURSOR_ROW_H + WRAPPER_GAP + PCELL / 2) - CELL / 2;

// Tile can be a string 'C' or object { letter: 'C', order: 1 }
const letterOf = v => v && typeof v === 'object' ? v.letter : v;
const orderOf = v => v && typeof v === 'object' ? v.order : null;
const isPreplaced = v => v && typeof v === 'object' && v.preplaced;
const ordinalOf = n => ['1st', '2nd', '3rd', '4th', '5th'][n - 1];

function useDemo(demoType) {
  const [vis, setVis] = useState({
    grid:        emptyGrid(),
    queue:       ['C', 'A', 'B', 'C', 'A'],
    dropping:    null,
    cursorCol:   null,
    cursorClick: false,
    highlight:   null,
    showOrder:   false,
    caption:     '',
  });

  const ref = useRef(vis);
  ref.current = vis;

  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;
    const wait = ms => sleep(ms, signal);
    const get  = () => ref.current;
    const set  = fn => { if (!signal.aborted) setVis(fn); };

    async function moveCursor(col, caption) {
      set(s => ({ ...s, cursorCol: col, cursorClick: false, ...(caption ? { caption } : {}) }));
      await wait(400);
    }

    async function click() {
      set(s => ({ ...s, cursorClick: true }));
      await wait(130);
      set(s => ({ ...s, cursorClick: false }));
      await wait(30);
    }

    async function dropLetter(col, caption) {
      const letter = get().queue[0];
      await moveCursor(col, caption);
      await click();

      const dr = destRow(get().grid, col);
      if (dr < 0) return;

      // Phase 0: place tile at preview position
      set(s => ({
        ...s,
        dropping:  { letter, col, destRow: dr, phase: 'preview' },
        cursorCol: null,
        queue: s.queue.slice(1),
      }));
      await wait(20);

      // Phase 1: slide from preview to top of target column
      set(s => s.dropping ? { ...s, dropping: { ...s.dropping, phase: 'slideToCol' } } : s);
      await wait(280);

      // Phase 2: drop down to destination row
      set(s => s.dropping ? { ...s, dropping: { ...s.dropping, phase: 'dropping' } } : s);
      const dropDuration = Math.max(0.05, (dr + 1) / DROP_SPEED) * 1000;
      await wait(dropDuration + 50);

      // Commit to grid
      set(s => {
        const grid = [...s.grid];
        grid[dr * COLS + col] = letter;
        return { ...s, grid, dropping: null };
      });
      await wait(160);
    }

    function applyGravity(grid) {
      const g = [...grid];
      for (let c = 0; c < COLS; c++) {
        const tiles = [];
        for (let r = 0; r < ROWS; r++) {
          if (g[r * COLS + c]) tiles.push(g[r * COLS + c]);
        }
        for (let r = 0; r < ROWS; r++) {
          const offset = r - (ROWS - tiles.length);
          g[r * COLS + c] = offset >= 0 ? tiles[offset] : null;
        }
      }
      return g;
    }

    async function highlightWord(indices, caption) {
      set(s => ({ ...s, highlight: new Set(indices), caption }));
      await wait(850);
      set(s => {
        const grid = [...s.grid];
        indices.forEach(i => { grid[i] = null; });
        return { ...s, grid: applyGravity(grid), highlight: null };
      });
      await wait(300);
    }

    const demos = {
      'click-plan': async () => {
        while (!signal.aborted) {
          const q = ['C', 'A', 'T', 'S', 'B'].map((l, i) => ({ letter: l, order: i + 1 }));
          set(s => ({ ...s, grid: emptyGrid(), highlight: null, showOrder: true, queue: q, caption: 'Letters drop in order: 1st, 2nd, 3rd...' }));
          await wait(1800);
          await dropLetter(0, 'Click a column — C falls to the bottom');
          await wait(500);
          set(s => ({ ...s, caption: 'A is now 2nd, then T, S, B...' }));
          await wait(1200);
          await dropLetter(1, 'A drops — queue shifts again');
          await wait(500);
          await dropLetter(1, 'Same column — it stacks on top!');
          await wait(500);
          set(s => ({ ...s, caption: 'Plan ahead using the queue!' }));
          await wait(1500);
        }
      },

      win: async () => {
        while (!signal.aborted) {
          // Pre-placed tiles (white): C(3,0), A(3,1), O(2,1)
          const startGrid = emptyGrid();
          startGrid[3 * COLS + 0] = { letter: 'C', preplaced: true };
          startGrid[3 * COLS + 1] = { letter: 'A', preplaced: true };
          startGrid[2 * COLS + 1] = { letter: 'O', preplaced: true };
          set(s => ({ ...s, grid: startGrid, highlight: null, queue: ['T', 'D', 'G', 'X', 'Y'], caption: 'Clear every tile to win' }));
          await wait(1400);

          // Drop T at col 2 → CAT across row 3, then O falls to (3,1)
          await dropLetter(2, 'T completes "CAT"');
          await highlightWord([3 * COLS + 0, 3 * COLS + 1, 3 * COLS + 2], '"CAT" cleared! O falls down');
          await wait(600);

          // O is now at (3,1). Drop D at col 0, G at col 2 → D-O-G across row 3
          await dropLetter(0, 'D to the left of O...');
          await dropLetter(2, 'G completes "DOG"');
          await highlightWord([3 * COLS + 0, 3 * COLS + 1, 3 * COLS + 2], '"DOG" cleared!');
          await wait(600);

          set(s => ({ ...s, caption: 'Board cleared — you win!' }));
          await wait(2000);
        }
      },

      match: async () => {
        while (!signal.aborted) {
          const fullQueue = ['C', 'A', 'T', 'G', 'O', 'D', 'X', 'Y', 'Z', 'T', 'C', 'A'];
          set(s => ({ ...s, grid: emptyGrid(), highlight: null, queue: fullQueue, caption: 'Spell words left to right' }));
          await wait(800);

          // Horizontal CAT
          await dropLetter(0, 'Drop C...');
          await dropLetter(1, 'Drop A next to it...');
          await dropLetter(2, 'Complete the word!');
          await highlightWord([3 * COLS + 0, 3 * COLS + 1, 3 * COLS + 2], '"CAT" across — word found!');
          await wait(600);

          // Vertical DOG
          set(s => ({ ...s, caption: 'Now stack letters vertically' }));
          await wait(600);
          await dropLetter(3, 'Drop G...');
          await dropLetter(3, 'Stack O on top...');
          await dropLetter(3, 'D completes the column!');
          await highlightWord([1 * COLS + 3, 2 * COLS + 3, 3 * COLS + 3], '"DOG" down — vertical match!');
          await wait(600);

          // Diagonal CAT — build support letters then the diagonal
          set(s => ({ ...s, caption: 'Build up for a diagonal' }));
          await wait(600);
          await dropLetter(0);                              // X → (3,0)
          await dropLetter(0);                              // Y → (2,0)
          await dropLetter(1);                              // Z → (3,1)
          await dropLetter(2, 'Place the diagonal letters...');  // T → (3,2)
          await dropLetter(0, 'C on top...');               // C → (1,0)
          await dropLetter(1, 'A completes the diagonal!'); // A → (2,1)
          await highlightWord([1 * COLS + 0, 2 * COLS + 1, 3 * COLS + 2], '"CAT" diagonal — nice!');
          await wait(1000);
        }
      },
    };

    demos[demoType]?.().catch(e => { if (e.name !== 'AbortError') console.error(e); });
    return () => ac.abort();
  }, [demoType]);

  return vis;
}

export default function AnimatedDemo({ demoType = 'drop' } = {}) {
  const { grid, queue, dropping, cursorCol, cursorClick, highlight, showOrder, caption } = useDemo(demoType);

  return (
    <div style={d.wrapper}>
      {/* 5-letter preview queue */}
      <div style={d.previewRow}>
        {Array(PREVIEW_SIZE).fill(null).map((_, i) => {
          const tile = queue[i];
          const letter = letterOf(tile);
          const order = orderOf(tile);
          const isNextUp = i === 0 && tile;
          const isEmpty = !tile;
          return (
            <div key={i} style={d.previewCol}>
              {showOrder && order ? (
                <span style={d.orderLabel}>{ordinalOf(order)}</span>
              ) : (
                <span style={d.orderLabelPlaceholder} />
              )}
              <div
                style={{
                  ...d.previewCell,
                  ...(isNextUp ? d.nextUp : {}),
                  ...(isEmpty ? d.emptyCellStyle : {}),
                  ...(showOrder && order ? d.orderHighlight : {}),
                }}
              >
                {isEmpty ? '\u2014' : letter}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: 'relative', width: GRID_W, height: 22 }}>
        {cursorCol !== null && (
          <div style={{
            ...d.cursor,
            left: cursorCol * STEP + (CELL - 16) / 2,
            transform: cursorClick ? 'scale(0.65)' : 'scale(1)',
          }}>
            ▼
          </div>
        )}
      </div>

      <div style={{ position: 'relative', width: GRID_W, overflow: 'visible' }}>
        <div style={d.grid}>
          {grid.map((tile, i) => {
            const letter = letterOf(tile);
            const order = orderOf(tile);
            return (
              <div
                key={i}
                style={{
                  ...d.cell,
                  ...(tile ? (isPreplaced(tile) ? d.cellPreplaced : d.cellFilled) : {}),
                  ...(highlight?.has(i) ? d.cellHighlight : {}),
                  position: 'relative',
                }}
              >
                {letter ?? ''}
                {showOrder && order && (
                  <span style={d.orderBadge}>{order}</span>
                )}
              </div>
            );
          })}
        </div>

        {dropping && (() => {
          const { phase, col, destRow: dr } = dropping;
          const colLeft = col * STEP;
          const colTop = -(STEP + 6);

          let left, top, transition;
          if (phase === 'preview') {
            left = PREVIEW_LEFT;
            top = PREVIEW_TOP;
            transition = 'none';
          } else if (phase === 'slideToCol') {
            left = colLeft;
            top = colTop;
            transition = 'left 0.25s ease-out, top 0.25s ease-out';
          } else {
            left = colLeft;
            top = dr * STEP;
            transition = `top ${Math.max(0.05, (dr + 1) / DROP_SPEED)}s linear`;
          }

          const droppingOrder = orderOf(dropping.letter);
          return (
            <div style={{ ...d.droppingTile, left, top, transition, position: 'absolute' }}>
              {letterOf(dropping.letter)}
              {showOrder && droppingOrder && (
                <span style={d.orderBadge}>{droppingOrder}</span>
              )}
            </div>
          );
        })()}
      </div>

      <p style={d.caption}>{caption || '\u00a0'}</p>
    </div>
  );
}

const d = {
  wrapper:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  previewRow:   { display: 'flex', alignItems: 'flex-end', gap: 5 },
  previewCol:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  orderLabel:   { fontSize: 14, fontWeight: 700, color: '#333', lineHeight: 1 },
  orderLabelPlaceholder: { height: 14 },
  previewCell:  {
    width: PCELL, height: PCELL, borderRadius: 7,
    background: '#888', border: '2px solid #333',
    color: '#fff', fontWeight: 800, fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    transition: 'transform 0.15s',
  },
  nextUp: {
    background: '#FFB74D',
    borderColor: '#FF9800',
    color: '#333',
    transform: 'scale(1.15)',
    boxShadow: '0 8px 22px rgba(255,152,0,0.22)',
  },
  emptyCellStyle: {
    background: '#f0f0f0', border: '2px solid #f0f0f0',
    color: '#ccc',
    boxShadow: 'none',
    fontSize: 22,
  },
  orderHighlight: {
    border: '2px solid #333',
    boxShadow: '0 0 8px rgba(0,0,0,0.25)',
  },
  orderBadge: {
    position: 'absolute', top: 2, left: 4,
    fontSize: 12, fontWeight: 700, lineHeight: 1,
    color: 'inherit',
  },
  cursor: {
    position: 'absolute', top: 2,
    fontSize: 16, color: '#1976D2',
    transition: 'left 0.3s ease-out, transform 0.1s ease',
    userSelect: 'none', lineHeight: 1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
    gap: 1,
  },
  cell: {
    width: CELL, height: CELL, borderRadius: 6,
    border: '0.75px solid #ddd',
    background: 'linear-gradient(145deg, #fff, #f5f5f5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, fontWeight: 800, color: '#333',
    transition: 'background 0.25s, border-color 0.25s, transform 0.15s',
  },
  cellFilled: {
    background: '#888', color: '#fff',
    border: '2px solid #333',
  },
  cellPreplaced: {
    background: '#fff', color: '#333',
    border: '2px solid #333',
  },
  cellHighlight: {
    background: '#4CAF50',
    borderColor: '#4CAF50', color: '#fff',
    transform: 'scale(1.05)',
  },
  droppingTile: {
    position: 'absolute',
    width: CELL, height: CELL, borderRadius: 6,
    background: 'linear-gradient(145deg, #e3f2fd, #bbdefb)',
    border: '2px solid #1976D2', color: '#333',
    fontWeight: 800, fontSize: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10, willChange: 'top, left',
  },
  caption: {
    fontSize: 13, color: '#555', textAlign: 'center',
    minHeight: 36, maxWidth: 220, lineHeight: 1.4, margin: 0,
  },
};
