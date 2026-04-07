import { useState, useEffect, useRef } from 'react';
import { COLS, CELL, STEP, GRID_W } from './constants.js';
import { emptyGrid, destRow, sleep } from './utils.js';

const PREVIEW_SIZE = 5;
const PCELL = 36;

function useDemo(demoType) {
  const [vis, setVis] = useState({
    grid:        emptyGrid(),
    queue:       ['C', 'A', 'B', 'C', 'A'],
    dropping:    null,
    cursorCol:   null,
    cursorClick: false,
    highlight:   null,
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

      set(s => ({
        ...s,
        dropping:  { letter, col, destRow: dr, atTop: true },
        cursorCol: null,
        queue: s.queue.slice(1),
      }));
      await wait(20);

      set(s => s.dropping ? { ...s, dropping: { ...s.dropping, atTop: false } } : s);
      await wait(400);

      set(s => {
        const grid = [...s.grid];
        grid[dr * COLS + col] = letter;
        return { ...s, grid, dropping: null };
      });
      await wait(160);
    }

    async function highlightWord(indices, caption) {
      set(s => ({ ...s, highlight: new Set(indices), caption }));
      await wait(850);
      set(s => {
        const grid = [...s.grid];
        indices.forEach(i => { grid[i] = null; });
        return { ...s, grid, highlight: null };
      });
      await wait(300);
    }

    const demos = {
      queue: async () => {
        while (!signal.aborted) {
          set(s => ({ ...s, grid: emptyGrid(), highlight: null, queue: ['C', 'A', 'T', 'S', 'B'], caption: 'The first letter is next to drop' }));
          await wait(1200);
          await dropLetter(0, 'C drops — queue shifts left');
          await wait(600);
          set(s => ({ ...s, caption: 'A is now next, then T, S, B...' }));
          await wait(1200);
          await dropLetter(1, 'A drops — queue shifts again');
          await wait(600);
          set(s => ({ ...s, caption: 'Plan ahead using the queue!' }));
          await wait(1500);
        }
      },

      drop: async () => {
        while (!signal.aborted) {
          set(s => ({ ...s, grid: emptyGrid(), highlight: null, queue: ['C', 'A', 'B', 'C', 'A'], caption: 'Click a column to drop the next letter' }));
          await wait(800);
          await dropLetter(0);
          await dropLetter(3);
          await dropLetter(1);
          set(s => ({ ...s, caption: 'Letters fall to the lowest empty row' }));
          await wait(1000);
        }
      },

      match: async () => {
        while (!signal.aborted) {
          // Horizontal
          set(s => ({ ...s, grid: emptyGrid(), highlight: null, queue: ['C', 'A', 'T', 'S', 'B'], caption: 'Spell words left to right' }));
          await wait(800);
          await dropLetter(0, 'Drop C...');
          await dropLetter(1, 'Drop A next to it...');
          await dropLetter(2, 'Complete the word!');
          await highlightWord([3 * COLS + 0, 3 * COLS + 1, 3 * COLS + 2], '"CAT" across — word found!');
          await wait(600);

          // Vertical
          set(s => ({ ...s, grid: emptyGrid(), highlight: null, queue: ['C', 'A', 'T', 'S', 'B'], caption: 'Stack letters in a column' }));
          await wait(800);
          await dropLetter(1, 'Drop C...');
          await dropLetter(1, 'Same column — it stacks!');
          await dropLetter(1, 'One more...');
          await highlightWord([1 * COLS + 1, 2 * COLS + 1, 3 * COLS + 1], '"CAT" down — also scores!');
          await wait(600);

          // Diagonal
          set(s => {
            const grid = emptyGrid();
            grid[3 * COLS + 0] = 'C';
            grid[3 * COLS + 1] = 'X';  grid[2 * COLS + 1] = 'A';
            grid[3 * COLS + 2] = 'X';  grid[2 * COLS + 2] = 'X';  grid[1 * COLS + 2] = 'T';
            return { ...s, grid, highlight: null, queue: ['S', 'B', 'E', 'D', 'A'], cursorCol: null, caption: 'Diagonals count too!' };
          });
          await wait(800);
          await highlightWord([3 * COLS + 0, 2 * COLS + 1, 1 * COLS + 2], '"CAT" diagonal — nice!');
          await wait(600);
        }
      },
    };

    demos[demoType]?.().catch(e => { if (e.name !== 'AbortError') console.error(e); });
    return () => ac.abort();
  }, [demoType]);

  return vis;
}

export default function AnimatedDemo({ demoType = 'drop' } = {}) {
  const { grid, queue, dropping, cursorCol, cursorClick, highlight, caption } = useDemo(demoType);

  return (
    <div style={d.wrapper}>
      {/* 5-letter preview queue */}
      <div style={d.previewRow}>
        {Array(PREVIEW_SIZE).fill(null).map((_, i) => {
          const letter = queue[i];
          const isNextUp = i === 0 && letter;
          const isEmpty = !letter;
          return (
            <div
              key={i}
              style={{
                ...d.previewCell,
                ...(isNextUp ? d.nextUp : {}),
                ...(isEmpty ? d.emptyCellStyle : {}),
              }}
            >
              {isEmpty ? '\u2014' : letter}
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
          {grid.map((letter, i) => (
            <div
              key={i}
              style={{
                ...d.cell,
                ...(letter ? d.cellFilled : {}),
                ...(highlight?.has(i) ? d.cellHighlight : {}),
              }}
            >
              {letter ?? ''}
            </div>
          ))}
        </div>

        {dropping && (
          <div style={{
            ...d.droppingTile,
            left: dropping.col * STEP,
            top:  dropping.atTop ? -(STEP + 6) : dropping.destRow * STEP,
            transition: dropping.atTop ? 'none' : 'top 0.38s ease-in',
          }}>
            {dropping.letter}
          </div>
        )}
      </div>

      <p style={d.caption}>{caption || '\u00a0'}</p>
    </div>
  );
}

const d = {
  wrapper:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  previewRow:   { display: 'flex', alignItems: 'center', gap: 5 },
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
    background: '#e0e0e0', borderColor: '#bdbdbd',
    color: '#bdbdbd', opacity: 0.4,
    boxShadow: 'none',
    fontSize: 22,
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
    zIndex: 10, willChange: 'top',
  },
  caption: {
    fontSize: 13, color: '#555', textAlign: 'center',
    minHeight: 36, maxWidth: 220, lineHeight: 1.4, margin: 0,
  },
};
