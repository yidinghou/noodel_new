import { useState, useEffect, useRef } from 'react';
import { COLS, CELL, GAP, STEP, GRID_W } from './constants.js';
import { emptyGrid, destRow, sleep } from './utils.js';

function useDemo(panelIdx) {
  const [vis, setVis] = useState({
    grid:        emptyGrid(),
    preview:     'C',
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

    async function dropLetter(letter, col, nextPreview, caption) {
      await moveCursor(col, caption);
      await click();

      const dr = destRow(get().grid, col);
      if (dr < 0) return;

      set(s => ({
        ...s,
        dropping:  { letter, col, destRow: dr, atTop: true },
        cursorCol: null,
        ...(nextPreview ? { preview: nextPreview } : {}),
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

    const panels = [
      // 0 — Basic dropping
      async () => {
        while (!signal.aborted) {
          set(s => ({ ...s, grid: emptyGrid(), highlight: null, preview: 'C', caption: 'Click a column to drop the next letter' }));
          await wait(800);
          await dropLetter('C', 0, 'A');
          await dropLetter('A', 3, 'B');
          await dropLetter('B', 1, 'C');
          set(s => ({ ...s, caption: 'Letters fall to the lowest empty row' }));
          await wait(1000);
        }
      },

      // 1 — Horizontal word
      async () => {
        while (!signal.aborted) {
          set(s => ({ ...s, grid: emptyGrid(), highlight: null, preview: 'C', caption: 'Spell words left to right to score' }));
          await wait(800);
          await dropLetter('C', 0, 'A', 'Drop C...');
          await dropLetter('A', 1, 'T', 'Drop A next to it...');
          await dropLetter('T', 2, 'S', 'Complete the word!');
          await highlightWord([3 * COLS + 0, 3 * COLS + 1, 3 * COLS + 2], '"CAT" — word found! Letters clear.');
          set(s => ({ ...s, caption: 'Longer words score more points' }));
          await wait(1000);
        }
      },

      // 2 — Vertical word
      async () => {
        while (!signal.aborted) {
          set(s => ({ ...s, grid: emptyGrid(), highlight: null, preview: 'C', caption: 'Stack letters in a column' }));
          await wait(800);
          await dropLetter('C', 1, 'A', 'Drop C into column 2...');
          await dropLetter('A', 1, 'T', 'Same column — it stacks up!');
          await dropLetter('T', 1, 'S', 'One more...');
          await highlightWord([1 * COLS + 1, 2 * COLS + 1, 3 * COLS + 1], '"CAT" down — scores the same!');
          set(s => ({ ...s, caption: 'Mix horizontal and vertical for big scores' }));
          await wait(1000);
        }
      },
    ];

    panels[panelIdx]?.().catch(e => { if (e.name !== 'AbortError') console.error(e); });
    return () => ac.abort();
  }, [panelIdx]);

  return vis;
}

export default function AnimatedDemo({ panelIdx = 0 } = {}) {
  const { grid, preview, dropping, cursorCol, cursorClick, highlight, caption } = useDemo(panelIdx);

  return (
    <div style={d.wrapper}>
      <div style={d.previewRow}>
        <span style={d.previewLabel}>Next</span>
        <div style={d.previewCell}>{preview}</div>
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
  previewRow:   { display: 'flex', alignItems: 'center', gap: 8 },
  previewLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' },
  previewCell:  {
    width: CELL, height: CELL,
    background: 'linear-gradient(145deg, #FFB74D, #FF9800)',
    color: '#fff', fontWeight: 800, fontSize: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, boxShadow: '0 2px 6px rgba(255,152,0,0.4)',
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
    gap: GAP,
  },
  cell: {
    width: CELL, height: CELL, borderRadius: 6,
    border: '2px solid #e0e0e0', background: '#f5f5f5',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, fontWeight: 800, color: '#333',
    transition: 'background 0.25s, border-color 0.25s, transform 0.15s',
  },
  cellFilled:    { background: '#e3f2fd', borderColor: '#90caf9' },
  cellHighlight: {
    background: 'linear-gradient(145deg, #a5d6a7, #4CAF50)',
    borderColor: '#4CAF50', color: '#fff',
    transform: 'scale(1.06)',
    boxShadow: '0 2px 8px rgba(76,175,80,0.45)',
  },
  droppingTile: {
    position: 'absolute',
    width: CELL, height: CELL, borderRadius: 8,
    background: 'linear-gradient(145deg, #FFB74D, #FF9800)',
    border: '2px solid #FF9800', color: '#fff',
    fontWeight: 800, fontSize: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(255,152,0,0.5)',
    zIndex: 10, willChange: 'top',
  },
  caption: {
    fontSize: 13, color: '#555', textAlign: 'center',
    minHeight: 36, maxWidth: 220, lineHeight: 1.4, margin: 0,
  },
};
