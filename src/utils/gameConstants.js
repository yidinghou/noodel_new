// Grid dimensions
export const GRID_COLS = 7;
export const GRID_ROWS = 6;
export const GRID_SIZE = GRID_COLS * GRID_ROWS; // 42 cells

// Game settings
export const TOTAL_LETTERS = 100;
export const MAX_MADE_WORDS = 20;  // max entries in the "made words" sidebar
export const MIN_WORD_LENGTH = 3;  // shortest word the detector considers

// Game modes
export const GAME_MODES = {
  CLASSIC: 'classic',
  CLEAR: 'clear'
};

// Game status values — mirrors the `status` field in initialState
export const STATUS = {
  IDLE: 'IDLE',
  PLAYING: 'PLAYING',
  PROCESSING: 'PROCESSING', // tiles are shaking; word detection paused
  GAME_OVER: 'GAME_OVER',
};

// Word directions — all possible values of wordData.direction
export const DIR = {
  H:  'horizontal',
  V:  'vertical',
  DD: 'diagonal-down-right',
  DU: 'diagonal-up-right',
};

// Game loop timing (ms) — tune all three here; replayPlayer imports GRACE_PERIOD_MS too
export const GRACE_PERIOD_MS  = 1000; // countdown before a detected word clears
export const SHAKE_DURATION_MS = 400; // tile shake animation after SET_MATCHED_INDICES
export const GRAVITY_DELAY_MS  = 150; // pause between tile removal and gravity drop

// Clear mode configuration
export const CLEAR_MODE_INITIAL_FILL_PERCENTAGE = 0.20; // 20% of grid
