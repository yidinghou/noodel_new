export const COLS = 4;
export const ROWS = 4;
export const CELL = 48;
export const GAP = 1;
export const STEP = CELL + GAP;
export const GRID_W = COLS * CELL + (COLS - 1) * GAP;

export const STEPS = [
  { number: 1, title: 'CLICK',  description: 'a column to drop the next letter onto the board. It falls to the lowest empty tile.' },
  { number: 2, title: 'PLAN',   description: 'ahead using the letter queue. Letters arrive in order from left to right.' },
  { number: 3, title: 'MAKE',   description: 'words horizontally, vertically, or diagonally. Three-letter minimum.' },
  { number: 4, title: 'WIN',    description: 'by clearing every tile. Words only count if they include a tile you placed.' },
];

export const DEMOS = [
  { title: 'CLICK & PLAN', demoType: 'click-plan' },
  { title: 'MAKE',         demoType: 'match' },
  { title: 'WIN',          demoType: 'win' },
];
