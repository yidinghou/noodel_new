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
     * Validate that PREVIEW_START config is consistent with PREVIEW_COUNT
     */
    validatePreviewStartConfig() {
        const lettersLength = CONFIG.PREVIEW_START.LETTERS.length;
        const positionsLength = CONFIG.PREVIEW_START.POSITIONS.length;
        const previewCount = CONFIG.GAME.PREVIEW_COUNT;
        
        if (lettersLength !== previewCount) {
            console.warn(`Config mismatch: PREVIEW_START.LETTERS.length (${lettersLength}) !== PREVIEW_COUNT (${previewCount})`);
        }
        if (positionsLength !== lettersLength) {
            console.warn(`Config mismatch: PREVIEW_START.POSITIONS.length (${positionsLength}) !== LETTERS.length (${lettersLength})`);
        }
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
     * Initialize Clear Mode - populate grid with ~50% letters
     */
    async initializeClearMode() {
        // Delegate to Clear Mode manager
        return await this.game.clearModeManager.initialize();
    }

    /**
     * Update UI elements for Clear Mode display
     */
    updateUIForClearMode() {
        // Delegate to Clear Mode manager
        return this.game.clearModeManager.updateUI();
    }

    /**
     * Update Clear Mode progress display
     */
    updateClearModeProgress() {
        // Delegate to Clear Mode manager
        return this.game.clearModeManager.updateProgress();
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

    /**
     * Handle Clear Mode completion
     */
    async handleClearModeComplete() {
        // Delegate to Clear Mode manager
        return await this.game.clearModeManager.handleComplete();
    }
}
