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
        
        // Setup keyboard shortcuts
        setupKeyboardShortcuts(game.sequencer);
        
        if (FeatureFlags.isEnabled('debug.enabled')) {
            console.log('🎮 Game initialized. Available console commands:');
            console.log('  - FeatureFlags.disable("animations.titleDrop")');
            console.log('  - sequencer.setSpeed(0.5) // Half speed');
            console.log('  - sequencer.getSequenceNames()');
            console.log('  - Press ESC to skip/speed up animations');
        }
    });
});

/**
 * Setup keyboard shortcuts for animation control
 * @param {AnimationSequencer} sequencer - The animation sequencer instance
 */
function setupKeyboardShortcuts(sequencer) {
    document.addEventListener('keydown', (e) => {
        // ESC key - speed up or skip current animation sequence
        if (e.key === 'Escape') {
            if (sequencer.isRunning()) {
                const currentSpeed = sequencer.speedMultiplier;
                
                if (currentSpeed === 1.0) {
                    // First press: Speed up to 5x
                    sequencer.setSpeed(5.0);
                    console.log('⚡ Animation speed: 5x (press ESC again to skip)');
                } else if (currentSpeed === 5.0) {
                    // Second press: Speed up to 10x (effectively instant)
                    sequencer.setSpeed(10.0);
                    console.log('⚡⚡ Animation speed: 10x (nearly instant)');
                } else {
                    // Third press: Reset to normal
                    sequencer.setSpeed(1.0);
                    console.log('➡️ Animation speed: 1x (normal)');
                }
            }
        }
        
        // Shift+S - Toggle animation speed (1x <-> 2x)
        if (e.shiftKey && e.key === 'S') {
            const currentSpeed = sequencer.speedMultiplier;
            if (currentSpeed === 1.0) {
                sequencer.setSpeed(2.0);
            } else {
                sequencer.setSpeed(1.0);
            }
        }
    });
}
