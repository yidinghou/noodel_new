// All reducer action type strings in one place.
// Import A and use A.ACTION_NAME instead of bare strings so typos are caught
// at parse time and IDE "find usages" works across the codebase.
export const A = {
  START_GAME:         'START_GAME',
  DROP_LETTER:        'DROP_LETTER',
  SET_PENDING:        'SET_PENDING',
  CLEAR_PENDING:      'CLEAR_PENDING',
  SET_MATCHED_INDICES:'SET_MATCHED_INDICES',
  REMOVE_WORDS:       'REMOVE_WORDS',
  APPLY_GRAVITY:      'APPLY_GRAVITY',
  GAME_OVER:          'GAME_OVER',
  LOAD_SAVED_GAME:    'LOAD_SAVED_GAME',
  RESET:              'RESET',
  SET_WORD_STATS:     'SET_WORD_STATS',
};
