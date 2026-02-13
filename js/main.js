import { Game } from './core/Game.js';
import { FEATURES, initializeFeatureFlagsFromURL } from './core/features.js';
import { DebugModeController } from './core/DebugModeController.js';

/**
 * Main entry point - Initialize the game when DOM is ready
 * Note: Animation timing is now controlled via CSS custom properties in base.css
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize feature flags from URL parameters (for beta testing)
    initializeFeatureFlagsFromURL();

    // Initialize debug controller early
    const debugController = new DebugModeController();
    const game = new Game(debugController);
    
    // Log active flags in debug mode
    if (FEATURES.DEBUG_ENABLED) {
        console.log('🚩 Features loaded:', FEATURES);
    }
    
    game.init().then(() => {
        // Expose game and sequencer globally for console access
        window.game = game;
        window.sequencer = game.sequencer;
        window.appState = game.appState;
        
        if (FEATURES.DEBUG_ENABLED) {
            console.log('🎮 Game initialized. Available console commands:');
            console.log('  - appState.getAllStates() // Get current states');
            console.log('  - appState.getDebugInfo() // Get state history and listeners');
        }
    });
});

