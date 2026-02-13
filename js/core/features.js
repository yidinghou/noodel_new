/**
 * Feature Flags - Simple boolean toggles for features
 * 
 * These control which features are active in the game.
 * No state awareness, no complex mappings - just feature toggles.
 */

export const FEATURES = {
    // Debug
    DEBUG_ENABLED: false,
    DEBUG_SKIP_ANIMATIONS: false,
    DEBUG_GRID_PATTERN: false,
    DEBUG_LOG_TIMING: false,

    // Core gameplay
    WORD_DETECTION: true,
    GRAVITY_PHYSICS: true,
    LETTER_PREVIEW: true,
    SCORE_TRACKING: true,
    WORD_GRACE_PERIOD_ENABLED: true,

    // Clear Mode
    CLEAR_MODE_ENABLED: true,              // Master flag: Enable/disable entire Clear Mode feature
    CLEAR_MODE_EMPTY_BOARD_WIN: true,     // Beta: Win condition when board is completely empty (stricter challenge)

    // UI
    MENU_SYSTEM: true,
    GRID_START_MENU: false,
    PREVIEW_START_MENU: true,
    TITLE_PROGRESS_BAR: true,

    // Animations
    ANIMATION_TITLE_DROP: true,
    ANIMATION_TITLE_SHAKE: true,
    ANIMATION_WORD_HIGHLIGHT: true,
    ANIMATION_LETTER_DROP: true,
    ANIMATION_MENU_FLIP: true,
    ANIMATION_MENU_DROP: false,
    ANIMATION_WORD_OVERLAY: true
};

/**
 * Initialize feature flags from URL parameters
 * Allows beta testing features via URL query params
 * Example: http://localhost:3000?betaClearModeEmptyBoard=true
 *
 * Supported params:
 * - betaClearModeEmptyBoard=true|false - Override CLEAR_MODE_EMPTY_BOARD_WIN
 */
export function initializeFeatureFlagsFromURL() {
    const params = new URLSearchParams(window.location.search);

    // Beta: Clear Mode empty board win condition
    if (params.has('betaClearModeEmptyBoard')) {
        const value = params.get('betaClearModeEmptyBoard').toLowerCase();
        FEATURES.CLEAR_MODE_EMPTY_BOARD_WIN = value === 'true';
        console.log(`✓ Beta feature override: CLEAR_MODE_EMPTY_BOARD_WIN = ${FEATURES.CLEAR_MODE_EMPTY_BOARD_WIN}`);
    }
}
