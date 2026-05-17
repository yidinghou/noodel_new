#!/usr/bin/env node
/**
 * Claude plays Noodel.
 *
 * Runs a full classic-mode game using the same game logic as the browser,
 * records a valid event-sourced session, and writes it to:
 *   scripts/claude_play_session.json
 *
 * To watch the replay:
 *   node scripts/claude_play.js
 *   Then paste the printed snippet into your browser console while
 *   game_replay.html is open (or use npm start and open the page first).
 */

import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Constants (mirrors gameConstants.js) ────────────────────────────────────

const GRID_COLS = 7;
const GRID_ROWS = 6;
const GRID_SIZE = GRID_COLS * GRID_ROWS;
const TOTAL_LETTERS = 100;

// ─── Dictionary ───────────────────────────────────────────────────────────────

function loadDictionary() {
  const files = [
    'public/words/3_letter_words.csv',
    'public/words/4_letter_words.csv',
    'public/words/5_letter_words.csv',
    'public/words/6_letter_words.csv',
    'public/words/7_letter_words.csv',
  ];
  const set = new Set();
  for (const f of files) {
    const lines = readFileSync(join(ROOT, f), 'utf8').split('\n');
    for (const line of lines.slice(1)) { // skip header
      const word = line.split(',')[0].trim().toUpperCase();
      if (word) set.add(word);
    }
  }
  return set;
}

// ─── Letter generation (mirrors letterUtils.js) ──────────────────────────────

const LETTER_FREQUENCIES = [
  ['E',12.70],['T',9.06],['A',8.17],['O',7.51],['I',6.97],['N',6.75],
  ['S',6.33],['H',6.09],['R',5.99],['D',4.25],['L',4.03],['C',2.78],
  ['U',2.76],['M',2.41],['W',2.36],['F',2.23],['G',2.02],['Y',1.97],
  ['P',1.93],['B',1.29],['V',0.98],['K',0.77],['J',0.15],['X',0.15],
  ['Q',0.10],['Z',0.07],
];
let _totalWeight = 0;
const _cumWeights = LETTER_FREQUENCIES.map(([l, w]) => {
  _totalWeight += w;
  return [l, _totalWeight];
});
const VOWELS = new Set(['A','E','I','O','U']);

function weightedRandom() {
  const r = Math.random() * _totalWeight;
  for (const [l, cw] of _cumWeights) if (r <= cw) return l;
  return 'E';
}

function generateLetterSequence(count) {
  const seq = [];
  for (let i = 0; i < count; i++) {
    const prev = seq.length ? seq[seq.length - 1].char : null;
    const consRun = (() => {
      let c = 0;
      for (let j = seq.length - 1; j >= 0; j--) {
        if (VOWELS.has(seq[j].char)) break;
        c++;
      }
      return c;
    })();
    const mustVowel = consRun >= 3;
    let letter;
    for (let tries = 0; tries < 100; tries++) {
      const c = weightedRandom();
      if (c !== prev && (!mustVowel || VOWELS.has(c))) { letter = c; break; }
    }
    if (!letter) letter = mustVowel ? 'E' : 'T';
    seq.push({ char: letter, id: `tile-${i}`, type: 'letter' });
  }
  return seq;
}

// ─── Word detection (mirrors wordUtils.js) ───────────────────────────────────

function extractWord(grid, r, c, dr, dc, len) {
  const letters = [], indices = [];
  for (let i = 0; i < len; i++) {
    const row = r + i * dr, col = c + i * dc;
    const idx = row * GRID_COLS + col;
    const cell = grid[idx];
    if (!cell) return null;
    letters.push(cell.char);
    indices.push(idx);
  }
  const dir = dr === 0 ? 'horizontal' : 'vertical';
  return { word: letters.join(''), indices, direction: dir };
}

function findWords(grid, dictionary) {
  const found = [];
  // horizontal
  for (let r = 0; r < GRID_ROWS; r++)
    for (let c = 0; c < GRID_COLS; c++)
      for (let len = 3; len <= GRID_COLS - c; len++) {
        const w = extractWord(grid, r, c, 0, 1, len);
        if (w && dictionary.has(w.word)) found.push(w);
      }
  // vertical
  for (let c = 0; c < GRID_COLS; c++)
    for (let r = 0; r < GRID_ROWS; r++)
      for (let len = 3; len <= GRID_ROWS - r; len++) {
        const w = extractWord(grid, r, c, 1, 0, len);
        if (w && dictionary.has(w.word)) found.push(w);
      }
  return found;
}

// ─── Scoring (mirrors scoringUtils.js) ───────────────────────────────────────

const LETTER_VALUES = {
  A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,
  P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10,
};
const LENGTH_BONUSES = { 3:0, 4:1, 5:3, 6:4, 7:7 };

function scoreWord(word) {
  let s = 0;
  for (const ch of word) s += LETTER_VALUES[ch] || 0;
  return s + (LENGTH_BONUSES[word.length] || 0);
}

// ─── Game simulation ──────────────────────────────────────────────────────────

function dropLetter(grid, col, tile) {
  const newGrid = [...grid];
  for (let row = GRID_ROWS - 1; row >= 0; row--) {
    const idx = row * GRID_COLS + col;
    if (!newGrid[idx]) {
      newGrid[idx] = { ...tile, type: 'filled', isPending: false, isMatched: false, pendingDirections: [], isInitial: false };
      return newGrid;
    }
  }
  return null; // column full
}

function applyGravity(grid) {
  const newGrid = Array(GRID_SIZE).fill(null);
  for (let col = 0; col < GRID_COLS; col++) {
    const cells = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      const cell = grid[row * GRID_COLS + col];
      if (cell) cells.push(cell);
    }
    for (let i = 0; i < cells.length; i++) {
      newGrid[(GRID_ROWS - cells.length + i) * GRID_COLS + col] = {
        ...cells[i], isPending: false, isMatched: false, pendingDirections: [], pendingResetCount: 0,
      };
    }
  }
  return newGrid;
}

function removeWords(grid, words) {
  const newGrid = [...grid];
  const toRemove = new Set(words.flatMap(w => w.indices));
  toRemove.forEach(i => { newGrid[i] = null; });
  return newGrid;
}

// Returns { grid, wordsCleared } after fully resolving cascades
function resolveGrid(grid, dictionary) {
  const allWordsCleared = [];
  let chainId = 0;
  let changed = true;
  while (changed) {
    changed = false;
    const words = findWords(grid, dictionary);
    if (words.length) {
      allWordsCleared.push({ words, chainId });
      grid = removeWords(grid, words);
      grid = applyGravity(grid);
      chainId++;
      changed = true;
    }
  }
  return { grid, allWordsCleared };
}

// ─── Claude's strategy ────────────────────────────────────────────────────────

function columnHeight(grid, col) {
  for (let row = 0; row < GRID_ROWS; row++) {
    if (grid[row * GRID_COLS + col]) return GRID_ROWS - row;
  }
  return 0;
}

function countAdjacentTiles(grid, col) {
  // How many existing tiles are adjacent (horizontally) to this column?
  let score = 0;
  for (let row = 0; row < GRID_ROWS; row++) {
    if (col > 0 && grid[row * GRID_COLS + col - 1]) score++;
    if (col < GRID_COLS - 1 && grid[row * GRID_COLS + col + 1]) score++;
  }
  return score;
}

function chooseColumn(grid, tile, dictionary) {
  let bestCol = -1;
  let bestScore = -Infinity;

  for (let col = 0; col < GRID_COLS; col++) {
    if (columnHeight(grid, col) >= GRID_ROWS) continue; // full

    const newGrid = dropLetter(grid, col, tile);
    const words = findWords(newGrid, dictionary);
    const wordScore = words.reduce((s, w) => s + scoreWord(w.word), 0);

    // Prefer: words formed, then adjacency (build clusters), then balanced height
    const height = columnHeight(grid, col);
    const adjacency = countAdjacentTiles(grid, col);
    const balance = -height; // prefer shorter columns to keep board tidy

    const total = wordScore * 100 + adjacency * 2 + balance;

    if (total > bestScore) {
      bestScore = total;
      bestCol = col;
    }
  }

  // Fallback: pick leftmost non-full column
  if (bestCol === -1) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (columnHeight(grid, col) < GRID_ROWS) { bestCol = col; break; }
    }
  }

  return bestCol;
}

// ─── Session builder ──────────────────────────────────────────────────────────

function generateSessionId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function playGame(dictionary) {
  const initialQueue = generateLetterSequence(TOTAL_LETTERS);
  const now = Date.now();

  const session = {
    schemaVersion: 3,
    sessionId: generateSessionId(),
    gameMode: 'classic',
    startedAt: now,
    lastActivityAt: now,
    status: 'in_progress',
    initialQueue: initialQueue.map(t => ({ ...t })),
    initialGrid: null,
    initialBlocks: [],
    events: [],
    checkpoint: null,
  };

  let grid = Array(GRID_SIZE).fill(null);
  let queue = [...initialQueue];
  let score = 0;
  let seq = 0;
  let ts = now;
  const madeWords = [];

  function addEvent(type, payload) {
    session.events.push({ seq: seq++, type, payload, ts: ts++ });
    session.lastActivityAt = ts;
  }

  console.log('🤖 Claude is playing Noodel...\n');

  while (queue.length > 0) {
    const tile = queue.shift();
    const col = chooseColumn(grid, tile, dictionary);

    if (col === -1) {
      console.log('Board is full — game over');
      break;
    }

    addEvent('DROP_LETTER', { column: col, letter: tile.char });
    grid = dropLetter(grid, col, tile);

    const { grid: resolvedGrid, allWordsCleared } = resolveGrid(grid, dictionary);

    for (const { words } of allWordsCleared) {
      const wordObjs = words.map(w => ({
        word: w.word,
        indices: w.indices,
        direction: w.direction,
        chainId: 0,
        comboDepth: 0,
        groupSize: words.length,
      }));
      addEvent('WORDS_CLEARED', { words: wordObjs });
      addEvent('GRAVITY', {});

      for (const w of words) {
        const ws = scoreWord(w.word);
        score += ws;
        madeWords.unshift({ word: w.word, score: ws, chainId: 0, comboDepth: 0 });
        console.log(`  ✓ ${w.word.padEnd(8)} +${ws} pts  (col ${col}, ${w.direction})`);
      }
    }

    grid = resolvedGrid;
  }

  // Build checkpoint (final state)
  const lastSeq = session.events.length > 0 ? session.events[session.events.length - 1].seq : -1;
  session.checkpoint = {
    afterEventSeq: lastSeq,
    grid: grid.map(cell => cell ? {
      char: cell.char, id: cell.id, type: cell.type,
      isMatched: false, isPending: false, pendingDirections: [],
      pendingResetCount: 0, isInitial: false,
    } : null),
    nextQueue: queue,
    lettersRemaining: queue.length,
    score,
    madeWords: madeWords.slice(0, 20),
  };
  session.status = 'completed';

  return { session, score };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('📖 Loading dictionary...');
const dictionary = loadDictionary();
console.log(`   ${dictionary.size.toLocaleString()} words loaded\n`);

const { session, score } = playGame(dictionary);

const outPath = join(__dirname, 'claude_play_session.json');
writeFileSync(outPath, JSON.stringify(session, null, 2));

const wordsFormed = session.events.filter(e => e.type === 'WORDS_CLEARED')
  .reduce((sum, e) => sum + e.payload.words.length, 0);

console.log(`\n🏁 Game over!`);
console.log(`   Score      : ${score}`);
console.log(`   Words found: ${wordsFormed}`);
console.log(`   Turns taken: ${session.events.filter(e => e.type === 'DROP_LETTER').length}`);
console.log(`\n📁 Session saved to: scripts/claude_play_session.json`);
console.log(`\n👀 To watch the replay:`);
console.log(`   1. Open http://localhost:3000/game_replay.html (run npm start first)`);
console.log(`   2. Open the browser console and paste:\n`);

const snippet = `const s = ${JSON.stringify(session).slice(0, 200)}...`;
console.log(`   fetch('/api/scores').then(() => {});`);
console.log(`   localStorage.setItem('noodel_replay_session', JSON.stringify(${JSON.stringify(session).length > 500 ? "/* session JSON */" : JSON.stringify(session)}));`);
console.log(`   location.reload();\n`);
console.log(`   (Or run: node scripts/load_replay.js  — it does this automatically via the server)\n`);
