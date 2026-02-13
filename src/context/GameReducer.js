// Game state shape
export const initialState = {
  grid: Array(100).fill(null), // null or { char: 'A', id: 'tile-1', type: 'filled', isMatched: false }
  score: 0,
  lettersRemaining: 100,
  nextQueue: [], // Array of upcoming letter objects
  status: 'IDLE', // IDLE, PLAYING, GAME_OVER, PROCESSING
  madeWords: []
};

// Game reducer
export function gameReducer(state, action) {
  switch (action.type) {
    case 'START_GAME':
      // TODO: Generate letter sequence
      return state;

    case 'DROP_LETTER':
      // TODO: Place letter in column
      return state;

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
