import { Game } from './Game.js';
import { CONFIG } from './config.js';

/**
 * Inject animation configuration as CSS custom properties
 */
function injectAnimationConfig() {
    const root = document.documentElement;
    root.style.setProperty('--letter-drop-duration', `${CONFIG.ANIMATION.LETTER_DROP_DURATION}ms`);
}

/**
 * Main entry point - Initialize the game when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    injectAnimationConfig();
    const game = new Game();
    game.init();
});
