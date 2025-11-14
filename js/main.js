import { Game } from './Game.js';
import { CONFIG } from './config.js';
import { FeatureFlags } from './FeatureFlags.js';

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
    // Load feature flags from URL parameters (e.g., ?debug=true&skipAnimations=true)
    FeatureFlags.loadFromURL();
    
    // Log active flags in debug mode
    if (FeatureFlags.isEnabled('debug.enabled')) {
        console.log('🚩 FeatureFlags loaded:', FeatureFlags.getAll());
    }
    
    injectAnimationConfig();
    const game = new Game();
    
    game.init().then(() => {
        // Expose game, FeatureFlags, and sequencer globally for console access
        window.game = game;
        window.FeatureFlags = FeatureFlags;
        window.sequencer = game.sequencer;
        
        if (FeatureFlags.isEnabled('debug.enabled')) {
            console.log('🎮 Game initialized. Available console commands:');
            console.log('  - FeatureFlags.disable("animations.titleDrop")');
            console.log('  - sequencer.setSpeed(0.5) // Half speed');
            console.log('  - sequencer.getSequenceNames()');
        }
    });
});
