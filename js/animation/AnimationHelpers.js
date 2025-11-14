/**
 * AnimationHelpers - Utility functions for managing CSS animations
 * Reduces duplication and provides consistent animation handling
 */
export const AnimationHelpers = {
    /**
     * Restart an animation by removing and re-adding a class
     * Forces a reflow to ensure the animation restarts
     * @param {HTMLElement} element - Element to restart animation on
     * @param {string} className - CSS class that triggers the animation
     */
    restart(element, className) {
        element.classList.remove(className);
        element.offsetHeight; // Force reflow
        element.classList.add(className);
    },
    
    /**
     * Wait for a specific CSS animation to complete
     * @param {HTMLElement} element - Element to watch
     * @param {string} animationName - Name of the animation to wait for
     * @returns {Promise} Resolves when animation completes
     */
    waitForAnimation(element, animationName) {
        return new Promise((resolve) => {
            element.addEventListener('animationend', (e) => {
                if (e.animationName === animationName) {
                    resolve();
                }
            }, { once: true });
        });
    },
    
    /**
     * Wait for a specific CSS transition to complete
     * @param {HTMLElement} element - Element to watch
     * @param {string} propertyName - CSS property name to wait for
     * @returns {Promise} Resolves when transition completes
     */
    waitForTransition(element, propertyName) {
        return new Promise((resolve) => {
            element.addEventListener('transitionend', (e) => {
                if (e.propertyName === propertyName) {
                    resolve();
                }
            }, { once: true });
        });
    },
    
    /**
     * Parse CSS time value (supports 's' and 'ms' units)
     * @param {string} value - CSS time value (e.g., '0.6s' or '600ms')
     * @returns {number} Time in milliseconds
     */
    parseTime(value) {
        const trimmed = value.trim();
        if (trimmed.endsWith('ms')) {
            return parseFloat(trimmed);
        } else if (trimmed.endsWith('s')) {
            return parseFloat(trimmed) * 1000;
        }
        return parseFloat(trimmed);
    },
    
    /**
     * Load animation timing from CSS custom properties
     * @returns {Object} Object containing all animation timing values in milliseconds
     */
    loadCSSTimings() {
        const root = getComputedStyle(document.documentElement);
        const parseTime = this.parseTime;
        
        return {
            titleDropDuration: parseTime(root.getPropertyValue('--animation-duration-title-drop')),
            titleShakeDuration: parseTime(root.getPropertyValue('--animation-duration-title-shake')),
            titleDropInterval: parseTime(root.getPropertyValue('--animation-delay-title-drop-interval')),
            controlsDelay: parseTime(root.getPropertyValue('--animation-delay-controls')),
            statsDelay: parseTime(root.getPropertyValue('--animation-delay-stats')),
            wordOverlayFade: parseTime(root.getPropertyValue('--animation-duration-word-overlay-fade')),
            wordOverlayDrop: parseTime(root.getPropertyValue('--animation-duration-word-overlay-drop')),
            letterStage1: parseTime(root.getPropertyValue('--animation-duration-letter-stage1')),
            letterDrop: parseTime(root.getPropertyValue('--animation-duration-letter-drop')),
            letterStage2Delay: parseTime(root.getPropertyValue('--animation-delay-letter-stage2')),
            wordFoundDuration: parseTime(root.getPropertyValue('--animation-duration-word-found')),
            wordClearDelay: parseTime(root.getPropertyValue('--animation-delay-word-clear'))
        };
    }
};
