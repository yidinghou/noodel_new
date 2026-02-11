import { CONFIG, GameModes } from '../config.js';
import { WordResolver } from '../word/WordResolver.js';
import { WordItem } from '../word/WordItem.js';
import { calculateWordScore } from '../scoring/ScoringUtils.js';
import { GamePhase } from './GameStateMachine.js';

/**
 * GameLifecycleManager - Manages game initialization, startup, and reset phases
 * Handles the full lifecycle of a game session
 */
export class GameLifecycleManager {
    constructor(game) {
        this.game = game;
    }

    /**
     * Validate that PREVIEW_START config is consistent and complete
     * Checks LETTERS, POSITIONS, ROWS alignment and bounds
     */
    validatePreviewStartConfig() {
        const letters = CONFIG.PREVIEW_START.LETTERS;
        const positions = CONFIG.PREVIEW_START.POSITIONS;
        const rows = CONFIG.PREVIEW_START.ROWS;
        const previewCount = CONFIG.GAME.PREVIEW_COUNT;
        const gridRows = CONFIG.GRID.ROWS;
        const gridCols = CONFIG.GRID.COLUMNS;
        
        // Check all three arrays exist
        if (!letters || !positions || !rows) {
            throw new Error('PREVIEW_START config incomplete: missing LETTERS, POSITIONS, or ROWS');
        }
        
        // Check all three arrays have matching length
        const lettersLength = letters.length;
        if (positions.length !== lettersLength) {
            throw new Error(`Config mismatch: PREVIEW_START.POSITIONS.length (${positions.length}) !== LETTERS.length (${lettersLength})`);
        }
        if (rows.length !== lettersLength) {
            throw new Error(`Config mismatch: PREVIEW_START.ROWS.length (${rows.length}) !== LETTERS.length (${lettersLength})`);
        }
        
        // Check alignment with PREVIEW_COUNT
        if (lettersLength !== previewCount) {
            throw new Error(`Config mismatch: PREVIEW_START.LETTERS.length (${lettersLength}) !== PREVIEW_COUNT (${previewCount})`);
        }
        
        // Validate POSITIONS are within grid bounds
        positions.forEach((col, idx) => {
            if (col < 0 || col >= gridCols) {
                throw new Error(`PREVIEW_START.POSITIONS[${idx}] = ${col} is outside grid column bounds [0, ${gridCols - 1}]`);
            }
        });
        
        // Validate ROWS are within grid bounds
        rows.forEach((row, idx) => {
            if (row < 0 || row >= gridRows) {
                throw new Error(`PREVIEW_START.ROWS[${idx}] = ${row} is outside grid row bounds [0, ${gridRows - 1}]`);
            }
        });
        
        console.log(`✓ PREVIEW_START config validated: ${lettersLength} letters in correct positions/rows`);
    }

    /**
     * Initialize the game (load dictionary, setup event listeners)
     */
    async init() {
        // Delegate to flow controller
        return await this.game.flowController.init();
    }
    
    /**
     * Public method for initializing dictionary (used internally by flowController)
     */
    async initializeWordResolver() {
        this.game.wordResolver = await WordResolver.create(this.game.state, this.game.dom);
        return this.game.wordResolver;
    }

    /**
     * Start the game
     */
    async start(gameMode = GameModes.CLASSIC) {
        // Delegate to flow controller
        return await this.game.flowController.startGame(gameMode);
    }

    /**
     * Reset the game to initial state
     */
    async reset() {
        // Delegate to flow controller
        return await this.game.flowController.resetGame();
    }

    /**
     * Initialize game after START sequence completes
     * Handles NOODEL overlay drop and game component initialization
     */
    async initializeGameAfterStartSequence() {
        // Transition to game ready phase
        this.game.stateMachine.transition(GamePhase.GAME_READY);
        
        // Mark game as started
        this.game.state.started = true;
        this.game.dom.startBtn.textContent = '🔄';
        
        // Drop NOODEL overlay if it exists and await the animation
        const noodelOverlay = document.getElementById('noodel-word-overlay');
        if (noodelOverlay) {
            // Create NOODEL word item for the made words list
            const noodelDef = this.game.wordResolver?.dictionary?.get('NOODEL') || CONFIG.GAME_INFO.NOODEL_DEFINITION;
            const noodelScore = calculateWordScore('NOODEL');
            const noodelItem = new WordItem('NOODEL', noodelDef, noodelScore);

            // Drop the overlay and wait for animation to complete
            // Add NOODEL to the made-words list but do NOT alter game score.
            await this.game.animator.dropNoodelWordOverlay(() => {
                this.game.score.addWord(noodelItem, false);
            });
            
            // Show made-words container after NOODEL overlay drops
            if (this.game.dom.madeWordsContainer) {
                this.game.dom.madeWordsContainer.classList.add('visible');
            }
        }
        
        // Initialize progress bar
        this.game.animator.updateLetterProgress(
            this.game.state.lettersRemaining,
            CONFIG.GAME.INITIAL_LETTERS
        );
        
        // Show and populate letter preview
        this.game.dom.preview.classList.add('visible');
        
        // Initialize and display letters (ensure nextLetters are populated)
        this.game.letters.initialize();
        this.game.letters.display();
        
        console.log('Game fully initialized after START sequence!');
        // Enable scoring from this point forward (game has started)
        this.game.state.scoringEnabled = true;
    }
}
