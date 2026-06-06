/**
 * Mulberry32 PRNG — deterministic, fast, good distribution.
 * Returns a function that produces [0, 1) floats.
 */
export function createSeededRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Module-level RNG singleton. Call seedModule(seed) before any generation.
let _rng = Math.random;

export function seedModule(seed) {
  _rng = createSeededRng(seed);
}

export function rng() {
  return _rng();
}

/** Returns YYYYMMDD integer for today's local date, used as the daily seed. */
export function getDailyDateSeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function ordinal(n) {
  if (n === 1 || n === 21 || n === 31) return `${n}st`;
  if (n === 2 || n === 22) return `${n}nd`;
  if (n === 3 || n === 23) return `${n}rd`;
  return `${n}th`;
}

/** Returns today's local date as YYYY-MM-DD (not UTC). */
export function getLocalDateString(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns a human-readable date string like "May 24th, 2026". */
export function formatDailyDate(date = new Date()) {
  return `${MONTH_NAMES[date.getMonth()]} ${ordinal(date.getDate())}, ${date.getFullYear()}`;
}
