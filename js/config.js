// Configuration constants
export const CONFIG = {
    // DEBUG MODE: Set to true to skip intro animations for faster testing
    DEBUG: true,
    GRID: {
        ROWS: 6,
        COLUMNS: 7,
        TOTAL_CELLS: 42
    },
    GAME: {
        INITIAL_LETTERS: 100,
        PREVIEW_COUNT: 4,
        ALPHABET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    },
    ANIMATION: {
        TITLE_DROP_INTERVAL: 0.25,      // seconds between each title letter drop
        TITLE_DROP_DURATION: 0.6,       // duration of title letter drop animation
        TITLE_SHAKE_DURATION: 400,      // milliseconds for shake animation
        CONTROLS_DELAY: 200,             // milliseconds before showing controls
        STATS_DELAY: 500,                // milliseconds before showing stats
        LETTER_STAGE_1_DELAY: 200,      // milliseconds for stage 1 (move to top)
        LETTER_STAGE_2_DELAY: 600,      // milliseconds for stage 2+3 (drop + settle)
        LETTER_DROP_START: 200,         // milliseconds before starting drop
        LETTER_DROP_DURATION: 300       // milliseconds for the actual drop transition
    },
    COLORS: {
        TITLE_ACTIVE: '#4CAF50'
    }
};
