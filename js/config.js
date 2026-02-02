// Game modes
export const GameModes = {
    CLASSIC: 'classic',     // Original mode: fill grid, run out of letters
    CLEAR: 'clear'          // New mode: clear populated grid
};

// Configuration constants
// Note: Feature flags moved to FeatureFlags.js for better organization
export const CONFIG = {
    GRID: {
        ROWS: 6,
        COLUMNS: 7,
        TOTAL_CELLS: 42
    },
    GAME: {
        INITIAL_LETTERS: 100,
        PREVIEW_COUNT: 5,
        CLEAR_MODE_CELL_PERCENTAGE: 0.5  // 50% of grid populated in Clear Mode
        // Note: Alphabet is now generated dynamically using LetterGenerator
        // based on English letter frequency distribution
    },
    PREVIEW_START: {
        // IMPORTANT: LETTERS.length must equal GAME.PREVIEW_COUNT (both are 5)
        // POSITIONS.length must also equal LETTERS.length
        LETTERS: ['S', 'T', 'R', 'T', 'A'],
        POSITIONS: [1, 2, 4, 5, 3], // Column positions for each letter (S->1, T->2, R->4, T->5, A->3)
        EXPECTED_ROW: 0,              // Row where clicks are expected
        ADD_TO_SCORE: false,          // Whether to add START word to score
        TRIGGER_GAME_START: true      // Whether to start game after sequence
    },
    // Note: Animation timing moved to CSS custom properties in base.css
    // AnimationController reads these values dynamically from CSS
    COLORS: {
        TITLE_ACTIVE: '#4CAF50'
    },
    GAME_INFO: {
        NOODEL_DEFINITION: 'A Word Game\nClick Grid, Place Letters, Make Words.'
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
