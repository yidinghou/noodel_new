import { CONFIG } from '../config.js';
import { LetterGenerator } from '../letter/LetterGenerator.js';
import { ClearModeInitializer } from './ClearModeInitializer.js';

/**
 * ClearModeManager - Manages Clear Mode gameplay
 * 
 * Responsibilities:
 * - Initialize Clear Mode (grid population, state setup)
 * - Update Clear Mode UI (progress display, labels)
 * - Handle Clear Mode completion (victory sequence)
 * 
 * Clear Mode is a game mode where players clear filled cells from a grid
 * rather than finding words. This separates that logic from the main Game class.
 */
export class ClearModeManager {
    /**
     * Initialize ClearModeManager
     * @param {Game} game - Game instance
     * @param {AnimationSequencer} sequencer - Animation sequencer
     */
    constructor(game, sequencer) {
        this.game = game;
        this.sequencer = sequencer;
    }

    /**
     * Initialize Clear Mode: populate grid with letters and set up UI
     */
    async initialize() {
        console.log('Initializing Clear Mode...');
        
        // Create a letter generator for initial population
        const letterGenerator = new LetterGenerator(CONFIG.GAME.INITIAL_LETTERS);
        
        // Populate grid with ~50% letters
        const populatedCells = ClearModeInitializer.populateGridWithLetters(
            this.game.state,
            letterGenerator
        );
        
        // Apply to DOM
        ClearModeInitializer.applyGridPopulation(this.game.dom.grid, populatedCells);
        ClearModeInitializer.updateGameState(this.game.state, populatedCells);
        
        // Update UI for Clear Mode
        this.updateUI();
        
        console.log(`Clear Mode initialized: ${populatedCells.length} cells populated (target: ${this.game.state.targetCellsToClear})`);
    }

    /**
     * Update UI elements for Clear Mode display (labels, progress counters)
     */
    updateUI() {
        // Update letters remaining label to show grid progress
        const label = this.game.dom.lettersRemainingContainer?.querySelector('.letters-remaining-label');
        if (label) {
            label.textContent = 'Grid Progress';
            label.classList.add('clear-mode');
        }
        
        // Update progress display
        this.updateProgress();
    }

    /**
     * Update Clear Mode progress display with current cleared cells
     */
    updateProgress() {
        if (this.game.state.isClearMode) {
            const remainingCells = this.game.state.targetCellsToClear - this.game.state.cellsClearedCount;
            const progressPercent = Math.round(this.game.state.getClearModeProgress());
            
            // Update progress display (e.g., "45/100" for remaining/total)
            if (this.game.dom.lettersRemainingValue) {
                this.game.dom.lettersRemainingValue.textContent = `${remainingCells}/${this.game.state.targetCellsToClear}`;
            }
            
            // Update progress bar if available
            if (this.game.animator && this.game.animator.updateLetterProgress) {
                this.game.animator.updateLetterProgress(remainingCells, this.game.state.targetCellsToClear);
            }
        }
    }

    /**
     * Handle Clear Mode completion (all cells cleared)
     */
    async handleComplete() {
        console.log('🎉 Clear Mode Complete!');
        
        this.game.state.started = false;
        this.game.dom.startBtn.textContent = '🎮';
        
        // Create context for victory sequence
        const context = {
            state: this.game.state,
            dom: this.game.dom,
            score: this.game.score,
            animator: this.game.animator,
            finalScore: this.game.state.score,
            game: this.game
        };
        
        // Play Clear Mode complete sequence (animations + restart option)
        if (this.sequencer && this.sequencer.sequences && this.sequencer.sequences['clearModeComplete']) {
            await this.sequencer.play('clearModeComplete', context);
        } else {
            // Fallback if sequence not defined yet - restart the game via reset
            console.log('Clear Mode complete sequence not yet defined, restarting via reset');
            this.game.reset();
        }
    }
}
