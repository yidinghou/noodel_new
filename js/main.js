import { Game } from './core/Game.js';

/**
 * Main entry point - Initialize the game when DOM is ready
 * Note: Animation timing is now controlled via CSS custom properties in base.css
 */
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    
    // Load feature flags from URL parameters (e.g., ?debug=true&skipAnimations=true)
    loadFeaturesFromURL(game.features);
    
    // Log active flags in debug mode
    if (game.features.isEnabled('debug.enabled')) {
        console.log('🚩 Features loaded:', game.features.getAll());
    }
    
    game.init().then(() => {
        // Expose game, features, sequencer, and appState globally for console access
        window.game = game;
        window.features = game.features;
        window.sequencer = game.sequencer;
        window.appState = game.appState;
        
        // Setup keyboard shortcuts
        setupKeyboardShortcuts(game.sequencer);
        
        if (game.features.isEnabled('debug.enabled')) {
            console.log('🎮 Game initialized. Available console commands:');
            console.log('  - features.disable("animations.titleDrop")');
            console.log('  - sequencer.setSpeed(0.5) // Half speed');
            console.log('  - sequencer.getSequenceNames()');
            console.log('  - appState.getAllStates() // Get current states');
            console.log('  - appState.getDebugInfo() // Get state history and listeners');
            console.log('  - Press ESC to skip/speed up animations');
        }
    });
});

/**
 * Load feature flags from URL parameters
 * @param {FeatureManager} features - The feature manager instance
 */
function loadFeaturesFromURL(features) {
    const params = new URLSearchParams(window.location.search);
    
    // Debug mode
    if (params.get('debug') === 'true') {
        features.enable('debug.enabled');
    }
    
    // Skip all animations
    if (params.get('skipAnimations') === 'true' || params.get('noAnimations') === 'true') {
        features.enable('debug.skipAnimations');
        features.disable('animations.titleDrop');
        features.disable('animations.titleShake');
        features.disable('animations.wordHighlight');
        features.disable('animations.letterDrop');
        features.disable('animations.menuFlip');
    }
    
    // Debug grid pattern
    if (params.get('debugGrid') === 'true') {
        features.enable('debug.gridPattern');
    }
    
    // Log timing
    if (params.get('logTiming') === 'true') {
        features.enable('debug.logTiming');
    }
    
    // Individual animation controls
    if (params.get('noTitleDrop') === 'true') {
        features.disable('animations.titleDrop');
    }
    if (params.get('noTitleShake') === 'true') {
        features.disable('animations.titleShake');
    }
    
    // Feature controls
    if (params.get('noProgressBar') === 'true') {
        features.disable('titleProgressBar');
    }
    if (params.get('noWordDetection') === 'true') {
        features.disable('wordDetection');
    }
    if (params.get('noGravity') === 'true') {
        features.disable('gravityPhysics');
    }
}

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
