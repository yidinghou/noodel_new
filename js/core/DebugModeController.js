// DebugModeController.js
// Handles all debug mode logic, keeping it separate from core game flow.
// Usage: Import and initialize early in main.js

import { FEATURES } from './features.js';
import { CONFIG } from '../config.js';
import { calculateIndex } from '../grid/gridUtils.js';

export class DebugModeController {
    constructor() {
        this.parseDebugFlags();
        if (FEATURES.DEBUG_ENABLED) {
            console.log('[DebugModeController] Debug mode is ENABLED');
        }
    }

    /**
     * Parse URL and localStorage for debug flags
     */
    parseDebugFlags() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('debug') === '1') {
            FEATURES.DEBUG_ENABLED = true;
        }
        
        if (urlParams.has('debugGrid')) {
            FEATURES.DEBUG_GRID_PATTERN = urlParams.get('debugGrid') === '1' || urlParams.get('debugGrid') === 'true';
        }
    }

    /**
     * Logic to run during game initialization
     * @param {Object} game - Game instance
     */
    onGameInit(game) {
        if (!FEATURES.DEBUG_ENABLED) return;

        // Load debug grid if pattern is enabled
        if (FEATURES.DEBUG_GRID_PATTERN) {
            this.loadDebugGrid(game);
        }
    }

    /**
     * Returns true if the START sequence should be skipped
     * @returns {boolean}
     */
    shouldSkipStartSequence() {
        return FEATURES.DEBUG_ENABLED && FEATURES.DEBUG_GRID_PATTERN;
    }

    /**
     * Explicitly load the debug grid if enabled
     * Extracted from GridController for better separation
     * @param {Object} game - Game instance
     */
    loadDebugGrid(game) {
        if (!game.grid || !game.dom) return;
        if (!CONFIG.DEBUG_GRID) {
            console.warn('[DebugModeController] No DEBUG_GRID pattern found in config');
            return;
        }

        console.log('[DebugModeController] Loading debug grid pattern...');

        // Iterate through the debug grid pattern
        for (let row = 0; row < CONFIG.GRID.ROWS; row++) {
            for (let col = 0; col < CONFIG.GRID.COLUMNS; col++) {
                const letter = CONFIG.DEBUG_GRID[row][col];
                if (letter && letter !== '') {
                    const index = calculateIndex(row, col, CONFIG.GRID.COLUMNS);
                    const square = game.dom.getGridSquare(index);
                    if (square) {
                        square.textContent = letter;
                        square.classList.add('filled');
                    }
                }
            }
        }

        // Update column fill counts to sync game logic with visual state
        if (typeof game.grid.updateColumnFillCounts === 'function') {
            game.grid.updateColumnFillCounts();
        }
        
        console.log('✅ Debug grid loaded successfully');
    }
}
