/**
 * GameStates - Board and gameplay logic states
 * Represents internal game state, not UI state
 * Focus: board readiness, input handling, word processing
 * 
 * STATE FLOW:
 * 1. BOARD_READY - Grid initialized, ready for play
 * 2. AWAITING_INPUT - Waiting for user to place a letter
 * 3. PROCESSING_WORDS - Checking for completed words
 * 4. Back to AWAITING_INPUT or GAME_OVER
 * 
 * Example: Game phase = GAME_RUNNING, state = AWAITING_INPUT
 */
export const GameplayStates = {
    BOARD_READY: 'board_ready',           // Grid initialized, ready for play
    AWAITING_INPUT: 'awaiting_input',     // Waiting for user to place a letter
    PROCESSING_WORDS: 'processing_words', // Checking for completed words
    GAME_OVER: 'game_over'                // No more moves, game ended
};

/**
 * Valid transitions between game states
 */
export const GameplayStateTransitions = {
    [GameplayStates.BOARD_READY]: [GameplayStates.AWAITING_INPUT],
    [GameplayStates.AWAITING_INPUT]: [GameplayStates.PROCESSING_WORDS, GameplayStates.GAME_OVER],
    [GameplayStates.PROCESSING_WORDS]: [GameplayStates.AWAITING_INPUT, GameplayStates.GAME_OVER],
    [GameplayStates.GAME_OVER]: [GameplayStates.BOARD_READY] // Can reset to start new game
};

/**
 * State metadata for debugging and logging
 */
export const GameplayStateMetadata = {
    [GameplayStates.BOARD_READY]: {
        description: 'Grid initialized, ready to start gameplay',
        isPlaying: false
    },
    [GameplayStates.AWAITING_INPUT]: {
        description: 'Waiting for user to place a letter',
        isPlaying: true
    },
    [GameplayStates.PROCESSING_WORDS]: {
        description: 'Checking for completed words, applying gravity',
        isPlaying: true
    },
    [GameplayStates.GAME_OVER]: {
        description: 'No more moves, game ended',
        isPlaying: false
    }
};

/**
 * Get valid next states for a given game state
 * @param {string} state - Current game state
 * @returns {string[]} Array of valid next states
 */
export function getValidGameplayTransitions(state) {
    return GameplayStateTransitions[state] || [];
}

/**
 * Check if a game state transition is valid
 * @param {string} fromState - Current state
 * @param {string} toState - Target state
 * @returns {boolean} True if transition is valid
 */
export function isValidGameplayTransition(fromState, toState) {
    return getValidGameplayTransitions(fromState).includes(toState);
}
