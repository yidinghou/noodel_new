/**
 * WebpageStates - High-level UI/page states
 * Represents overall app flow and what the user sees
 * 
 * STATE FLOW:
 * 1. PAGE_LOAD - Initial load: grid only, no menu
 * 2. START_MENU - NOODEL title and start button visible
 * 3. GAME_RUNNING - Gameplay active, menu hidden
 * 4. RESET - Reset animation sequence
 * 5. Back to START_MENU
 * 
 * FUTURE:
 * - GAME_PAUSED - Game paused with pause UI
 */
export const WebpageStates = {
    PAGE_LOAD: 'page_load',           // Initial load: grid only, no menu
    START_MENU: 'start_menu',         // NOODEL title and start button visible
    GAME_RUNNING: 'game_running',     // Gameplay active, menu hidden
    GAME_PAUSED: 'game_paused',       // Game paused (future feature)
    RESET: 'reset'                    // Reset animation sequence
};

/**
 * Valid transitions between webpage states
 * Defines which states can transition to which other states
 */
export const WebpageStateTransitions = {
    [WebpageStates.PAGE_LOAD]: [WebpageStates.START_MENU],
    [WebpageStates.START_MENU]: [WebpageStates.GAME_RUNNING, WebpageStates.RESET],
    [WebpageStates.GAME_RUNNING]: [WebpageStates.RESET, WebpageStates.GAME_PAUSED],
    [WebpageStates.GAME_PAUSED]: [WebpageStates.GAME_RUNNING, WebpageStates.RESET],
    [WebpageStates.RESET]: [WebpageStates.START_MENU]
};

/**
 * State metadata for debugging and logging
 */
export const WebpageStateMetadata = {
    [WebpageStates.PAGE_LOAD]: {
        description: 'Initial page load, grid visible only',
        allowsUserInput: false
    },
    [WebpageStates.START_MENU]: {
        description: 'NOODEL title and start button visible',
        allowsUserInput: true
    },
    [WebpageStates.GAME_RUNNING]: {
        description: 'Gameplay active, menu hidden',
        allowsUserInput: true
    },
    [WebpageStates.GAME_PAUSED]: {
        description: 'Game paused with pause UI',
        allowsUserInput: true
    },
    [WebpageStates.RESET]: {
        description: 'Reset animation sequence playing',
        allowsUserInput: false
    }
};

/**
 * Get valid next states for a given webpage state
 * @param {string} state - Current webpage state
 * @returns {string[]} Array of valid next states
 */
export function getValidTransitions(state) {
    return WebpageStateTransitions[state] || [];
}

/**
 * Check if a transition is valid
 * @param {string} fromState - Current state
 * @param {string} toState - Target state
 * @returns {boolean} True if transition is valid
 */
export function isValidTransition(fromState, toState) {
    return getValidTransitions(fromState).includes(toState);
}
