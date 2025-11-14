// Configuration constants
export const CONFIG = {
    // DEBUG MODE: Set to true to skip intro animations for faster testing
    DEBUG: false,
    
    // DEBUG GRID: Set to true to pre-populate grid with test pattern
    DEBUG_GRID_ENABLED: true,
    
    GRID: {
        ROWS: 6,
        COLUMNS: 7,
        TOTAL_CELLS: 42
    },
    GAME: {
        INITIAL_LETTERS: 100,
        PREVIEW_COUNT: 4
        // Note: Alphabet is now generated dynamically using LetterGenerator
        // based on English letter frequency distribution
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
        LETTER_DROP_DURATION: 400,      // milliseconds for the actual drop transition TODO: calculate as stage2 - stage1
        WORD_ANIMATION_DURATION: 400,   // milliseconds for word highlight and shake
        WORD_CLEAR_DELAY: 100           // milliseconds to wait before clearing word cells
    },
    COLORS: {
        TITLE_ACTIVE: '#4CAF50'
    },
    GAME_INFO: {
        NOODEL_DEFINITION: 'A Word Game\nClick Grid, Place Letters, Make Words.'
    },
    FEATURES: {
        TITLE_PROGRESS_BAR: true  // Show progress bar in NOODEL title (green to gray as letters are used)
    },
    
    // DEBUG GRID PATTERNS
    // Each row is represented as an array of 7 columns (empty string '' = empty cell)
    // Grid is arranged bottom-to-top (row 0 is the top, row 5 is the bottom)
    DEBUG_GRID: [
        // Row 0 (Top)
        ['', '', '', '', '', '', ''],
        // Row 1
        ['', '', '', '', '', '', ''],
        // Row 2
        ['', '', '', '', '', '', ''],
        // Row 3
        ['', '', 'T', '', '', '', ''],
        // Row 4
        ['', 'A', 'C', 'A', '', '', ''],
        // Row 5 (Bottom)
        ['', 'A', 'T', '', 'T', '', '']
    ]
    
    // Alternative test patterns (uncomment to use):
    
    // Pattern 1: Horizontal word at bottom
    // DEBUG_GRID: [
    //     ['', '', '', '', '', '', ''],
    //     ['', '', '', '', '', '', ''],
    //     ['', '', '', '', '', '', ''],
    //     ['', '', '', '', '', '', ''],
    //     ['', '', '', '', '', '', ''],
    //     ['C', 'A', 'T', '', '', '', '']
    // ]
    
    // Pattern 2: Vertical word
    // DEBUG_GRID: [
    //     ['', '', '', '', '', '', ''],
    //     ['', '', '', '', '', '', ''],
    //     ['', '', '', '', '', '', ''],
    //     ['D', '', '', '', '', '', ''],
    //     ['O', '', '', '', '', '', ''],
    //     ['G', '', '', '', '', '', '']
    // ]
    
    // Pattern 3: Multiple words (horizontal + vertical)
    // DEBUG_GRID: [
    //     ['', '', '', '', '', '', ''],
    //     ['', '', '', '', '', '', ''],
    //     ['', '', '', '', '', '', ''],
    //     ['T', '', '', '', '', '', ''],
    //     ['H', 'A', 'T', '', '', '', ''],
    //     ['E', '', '', '', '', '', '']
    // ]
    
    // Pattern 4: Diagonal word (DOG)
    // DEBUG_GRID: [
    //     ['', '', '', '', '', '', ''],
    //     ['', '', '', '', '', '', ''],
    //     ['', '', '', '', '', '', ''],
    //     ['D', '', '', '', '', '', ''],
    //     ['', 'O', '', '', '', '', ''],
    //     ['', '', 'G', '', '', '', '']
    // ]
};
