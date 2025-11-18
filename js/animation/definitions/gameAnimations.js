import { WebpageStates } from '../../core/WebpageStates.js';

/**
 * Game Animation Definitions
 * 
 * Defines animations for gameplay actions (not state transitions)
 * These are typically called during GAME_RUNNING state
 */

export const gameAnimations = {
    /**
     * Drop letter animation
     * Called when user places a letter in a column
     */
    dropLetter: {
        fromState: null, // Not a state transition, called during gameplay
        toState: null,
        variant: 'default',
        requiredFeature: 'animations.letterDrop',
        handler: async (controllers, column, letter, targetRow, onComplete) => {
            if (controllers.animator) {
                controllers.animator.dropLetterInColumn(column, letter, targetRow, onComplete);
            }
        }
    },
    
    /**
     * Highlight and shake word when found
     */
    highlightWord: {
        fromState: null,
        toState: null,
        variant: 'default',
        requiredFeature: 'animations.wordHighlight',
        handler: async (controllers, positions) => {
            if (controllers.animator) {
                await controllers.animator.highlightAndShakeWord(positions);
            }
        }
    },
    
    /**
     * Show word overlay (NOODEL word display)
     */
    showWordOverlay: {
        fromState: null,
        toState: null,
        variant: 'default',
        requiredFeature: 'animations.wordOverlay',
        handler: async (controllers, wordItem) => {
            if (controllers.animator && controllers.animator.overlayManager) {
                return controllers.animator.overlayManager.createOverlay(wordItem);
            }
        }
    },
    
    /**
     * Drop word overlay to made words section
     */
    dropWordOverlay: {
        fromState: null,
        toState: null,
        variant: 'default',
        requiredFeature: 'animations.wordOverlay',
        handler: async (controllers, overlay, onComplete) => {
            if (controllers.animator && controllers.animator.overlayManager) {
                await controllers.animator.overlayManager.dropOverlay(overlay, onComplete);
            }
        }
    }
};

/**
 * Get all game animation names
 * @returns {string[]} Array of animation names
 */
export function getGameAnimationNames() {
    return Object.keys(gameAnimations);
}
