export const COLS = 4;
export const ROWS = 4;
export const CELL = 48;
export const GAP = 1;
export const STEP = CELL + GAP;
export const GRID_W = COLS * CELL + (COLS - 1) * GAP;

export const STEPS = [
  { number: 1, title: 'QUEUE', description: 'Letters arrive in order from left to right\u2014use the preview to set up your next move.', demoType: 'queue' },
  { number: 2, title: 'DROP', description: 'Click a column to place the Preview Letter. It always falls to the lowest empty space.', demoType: 'drop' },
  { number: 3, title: 'MATCH', description: 'Form words horizontally, vertically, or diagonally.', demoType: 'match' },
];
