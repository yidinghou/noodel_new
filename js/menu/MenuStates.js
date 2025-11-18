/**
 * MenuStates - Sub-states for menu visibility and type
 * These are sub-states within WebpageStates (e.g., START_MENU or GAME_RUNNING)
 * 
 * NOTE: MenuStates now represent menu visibility/type, not overall app flow
 * For overall UI flow, see WebpageStates (PAGE_LOAD, START_MENU, GAME_RUNNING)
 * 
 * STATE FLOW:
 * 1. HIDDEN → START_MENU_PREVIEW (show START letters)
 * 2. START_MENU_PREVIEW → HIDDEN (user clicks START)
 * 
 * ALTERNATIVE FLOW (grid menu):
 * 1. HIDDEN → MENU_PREVIEW (show menu in preview area)
 * 2. MENU_PREVIEW → MENU_DROPPED (user clicks grid)
 * 3. MENU_DROPPED → HIDDEN (user clicks START button)
 */

export const MenuStates = {
    /**
     * No menu visible
     */
    HIDDEN: 'hidden',
    
    /**
     * START letters are displayed in preview area
     * Waiting for user to click any START letter to begin game
     */
    START_MENU_PREVIEW: 'start_menu_preview',
    
    /**
     * Menu buttons are displayed in preview area
     * Waiting for user to click grid to trigger drop
     */
    MENU_PREVIEW: 'menu_preview',
    
    /**
     * Menu buttons have dropped into grid positions
     * Waiting for user to select an option (START, LOGIN, MORE)
     */
    MENU_DROPPED: 'menu_dropped'
};

/**
 * Valid state transitions
 * Maps current state → allowed next states
 */
export const MenuStateTransitions = {
    [MenuStates.HIDDEN]: [
        MenuStates.START_MENU_PREVIEW,  // Show START letters
        MenuStates.MENU_PREVIEW,         // Show menu in preview area
        MenuStates.MENU_DROPPED          // Show menu directly in grid
    ],
    
    [MenuStates.START_MENU_PREVIEW]: [
        MenuStates.HIDDEN  // User clicks START or cancels
    ],
    
    [MenuStates.MENU_PREVIEW]: [
        MenuStates.MENU_DROPPED,  // User clicks grid
        MenuStates.HIDDEN         // User cancels
    ],
    
    [MenuStates.MENU_DROPPED]: [
        MenuStates.HIDDEN  // User selects option or cancels
    ]
};

/**
 * State metadata for debugging and logging
 */
export const MenuStateMetadata = {
    [MenuStates.HIDDEN]: {
        description: 'No menu visible',
        allowsUserInput: false,
        isMenuVisible: false
    },
    [MenuStates.START_MENU_PREVIEW]: {
        description: 'START letters in preview area, awaiting click',
        allowsUserInput: true,
        isMenuVisible: true
    },
    [MenuStates.MENU_PREVIEW]: {
        description: 'Menu in preview area, awaiting grid click',
        allowsUserInput: true,
        isMenuVisible: true
    },
    [MenuStates.MENU_DROPPED]: {
        description: 'Menu buttons in grid, awaiting selection',
        allowsUserInput: true,
        isMenuVisible: true
    }
};

/**
 * Get valid next menu states
 * @param {string} state - Current menu state
 * @returns {string[]} Array of valid next states
 */
export function getValidMenuTransitions(state) {
    return MenuStateTransitions[state] || [];
}

/**
 * Check if a menu state transition is valid
 * @param {string} fromState - Current state
 * @param {string} toState - Target state
 * @returns {boolean} True if transition is valid
 */
export function isValidMenuTransition(fromState, toState) {
    return getValidMenuTransitions(fromState).includes(toState);
}

/**
 * DEPRECATED: Old state constants for backward compatibility
 * These will be removed in Phase 2
 */
export const VALID_TRANSITIONS = MenuStateTransitions;
export const STATE_METADATA = MenuStateMetadata;
