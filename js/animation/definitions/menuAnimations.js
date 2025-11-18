import { WebpageStates } from '../../core/WebpageStates.js';

/**
 * Menu Animation Definitions
 * 
 * Defines all animations related to menu transitions
 * Each animation is self-contained and can be enabled/disabled via feature flags
 */

export const menuAnimations = {
    /**
     * PAGE_LOAD → START_MENU
     * Show START menu after initial page load
     */
    pageLoadToStartMenu: {
        fromState: WebpageStates.PAGE_LOAD,
        toState: WebpageStates.START_MENU,
        variant: 'default',
        requiredFeature: 'previewStartMenu',
        handler: async (controllers) => {
            // Show START letters in preview area
            if (controllers.startMenuPreview) {
                await controllers.startMenuPreview.show();
            }
        }
    },
    
    /**
     * PAGE_LOAD → START_MENU (grid menu variant)
     * Show grid-based menu after initial page load
     */
    pageLoadToStartMenuGrid: {
        fromState: WebpageStates.PAGE_LOAD,
        toState: WebpageStates.START_MENU,
        variant: 'grid',
        requiredFeature: 'gridStartMenu',
        handler: async (controllers) => {
            // Show menu in grid
            if (controllers.menu) {
                await controllers.menu.show(false, controllers.game);
            }
        }
    },
    
    /**
     * START_MENU → GAME_RUNNING
     * Transition from menu to active gameplay
     */
    startMenuToGameRunning: {
        fromState: WebpageStates.START_MENU,
        toState: WebpageStates.GAME_RUNNING,
        variant: 'default',
        requiredFeature: 'animations.menuDrop',
        handler: async (controllers) => {
            const { startMenuPreview, menu, game } = controllers;
            
            // Change button to reset icon
            if (game?.dom?.startBtn) {
                game.dom.startBtn.textContent = '🔄';
            }
            
            // Hide menu/preview
            if (startMenuPreview && startMenuPreview.isMenuActive()) {
                startMenuPreview.hide();
            }
            if (menu && menu.isActive()) {
                menu.hide();
            }
        }
    },
    
    /**
     * GAME_RUNNING → RESET
     * Animate reset transition (shake title, prepare for reset)
     */
    gameRunningToReset: {
        fromState: WebpageStates.GAME_RUNNING,
        toState: WebpageStates.RESET,
        variant: 'default',
        requiredFeature: 'animations.titleShake',
        handler: async (controllers) => {
            const { animator, game, grid, letters, menu, score } = controllers;
            
            // Reset game state data
            if (game?.state) {
                game.state.started = false;
                game.state.reset();
            }
            
            // Clear and regenerate the grid
            if (game?.dom?.grid) {
                game.dom.grid.innerHTML = '';
            }
            if (grid) {
                grid.generate();
            }
            
            // Generate new letter sequence
            if (letters) {
                letters.initialize();
            }
            
            // Reset progress bar to 100%
            if (animator) {
                const CONFIG = await import('../../config.js').then(m => m.CONFIG);
                animator.updateLetterProgress(
                    CONFIG.GAME.INITIAL_LETTERS,
                    CONFIG.GAME.INITIAL_LETTERS
                );
            }
            
            // Clear preview tiles
            if (menu) {
                menu.clearPreviewTiles();
            }
            
            // Hide preview row
            if (game?.dom?.preview) {
                game.dom.preview.classList.remove('visible');
            }
            
            // Change button back to start icon
            if (game?.dom?.startBtn) {
                game.dom.startBtn.textContent = '🎮';
            }
            
            // Shake title to indicate reset
            if (animator) {
                await animator.shakeAllTitleLetters();
            }
        }
    },
    
    /**
     * RESET → START_MENU
     * Show menu again after reset
     */
    resetToStartMenu: {
        fromState: WebpageStates.RESET,
        toState: WebpageStates.START_MENU,
        variant: 'default',
        requiredFeature: 'previewStartMenu',
        handler: async (controllers) => {
            // Show START letters in preview
            if (controllers.startMenuPreview) {
                await controllers.startMenuPreview.show();
            }
        }
    },
    
    /**
     * RESET → START_MENU (flip variant)
     * Show menu with flip animation after reset
     */
    resetToStartMenuFlip: {
        fromState: WebpageStates.RESET,
        toState: WebpageStates.START_MENU,
        variant: 'flip',
        requiredFeature: 'animations.menuFlip',
        handler: async (controllers) => {
            // Show menu with flip animation
            if (controllers.menu) {
                await controllers.menu.show(true, controllers.game);
            }
        }
    }
};

/**
 * Get all menu animation names
 * @returns {string[]} Array of animation names
 */
export function getMenuAnimationNames() {
    return Object.keys(menuAnimations);
}

/**
 * Get animations for a specific transition
 * @param {string} fromState - Source state
 * @param {string} toState - Target state
 * @returns {Object[]} Array of animation definitions
 */
export function getAnimationsForTransition(fromState, toState) {
    return Object.values(menuAnimations).filter(
        anim => anim.fromState === fromState && anim.toState === toState
    );
}
