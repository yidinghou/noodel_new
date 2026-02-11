import { Game } from './core/Game.js';
import { FEATURES } from './core/features.js';

/**
 * Main entry point - Initialize the game when DOM is ready
 * Note: Animation timing is now controlled via CSS custom properties in base.css
 */
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    
    // Log active flags in debug mode
    if (FEATURES.DEBUG_ENABLED) {
        console.log('🚩 Features loaded:', FEATURES);
    }
    
    game.init().then(() => {
        // Expose game and sequencer globally for console access
        window.game = game;
        window.sequencer = game.sequencer;
        window.appState = game.appState;
        
        // Setup keyboard shortcuts
        setupKeyboardShortcuts(game.sequencer);
        
        if (FEATURES.DEBUG_ENABLED) {
            console.log('🎮 Game initialized. Available console commands:');
            console.log('  - sequencer.setSpeed(0.5) // Half speed');
            console.log('  - sequencer.getSequenceNames()');
            console.log('  - appState.getAllStates() // Get current states');
            console.log('  - appState.getDebugInfo() // Get state history and listeners');
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
