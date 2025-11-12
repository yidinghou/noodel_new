import { Game } from './Game.js';

/**
 * Main entry point - Initialize the game when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});
