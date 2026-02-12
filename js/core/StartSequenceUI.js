import { CONFIG } from '../config.js';
import { TutorialUIState } from './gameConstants.js';
import { calculateIndex } from '../grid/gridUtils.js';
import { FEATURES } from './features.js';

/**
 * StartSequenceUI - Manages the START sequence tutorial UI and interactions
 * Handles highlighting, preview updates, and tutorial completion
 */
export class StartSequenceUI {
    constructor(game) {
        this.game = game;
    }

    /**
     * Initialize the START sequence and highlight the first square
     */
    initTutorialState() {
        this.game.startSequence.start();
        this.highlightNextStartGuide();
        
        // Update tutorial UI state and visibility
        this.game.tutorialUIState = TutorialUIState.ACTIVE;
        this.updateTutorialUI();
    }

    /**
     * Highlight the next grid square in the START sequence
     */
    highlightNextStartGuide() {
        if (!this.game.startSequence.isActive || this.game.startSequence.currentIndex >= CONFIG.PREVIEW_START.LETTERS.length) {
            return; // START sequence not active or complete
        }
        
        const expected = this.game.startSequence.getCurrentExpectedPosition();
        const column = expected.column;

        // Highlight only the configured focus square for this letter
        const focusIndex = calculateIndex(expected.row, column, CONFIG.GRID.COLUMNS);
        const focusSquare = this.game.dom.getGridSquare(focusIndex);
        if (focusSquare) {
            focusSquare.classList.add('start-guide');
        }

        console.log(`Highlighting single square at row ${expected.row}, column ${column}`);
    }

    /**
     * Clear the current START guide highlight
     */
    clearStartGuide() {
        // Remove start-guide and focus classes from all highlighted squares
        const highlighted = this.game.dom.grid.querySelectorAll('.start-guide, .start-guide-focus');
        highlighted.forEach(sq => {
            sq.classList.remove('start-guide');
            sq.classList.remove('start-guide-focus');
        });
    }

    /**
     * Update the START sequence preview after a letter is dropped
     * Removes the first letter and shifts remaining letters
     */
    updateStartPreviewAfterDrop() {
        const previewBlocks = this.game.dom.preview.querySelectorAll('.preview-letter-block');
        const remainingLetters = CONFIG.PREVIEW_START.LETTERS.slice(this.game.startSequence.currentIndex);
        
        // Update preview blocks with remaining START letters
        previewBlocks.forEach((block, index) => {
            if (index < remainingLetters.length) {
                block.textContent = remainingLetters[index];
                // First remaining letter gets next-up styling
                if (index === 0) {
                    block.classList.add('next-up');
                } else {
                    block.classList.remove('next-up');
                }
            } else {
                // Empty blocks for remaining slots
                block.textContent = '';
                block.classList.remove('next-up');
                block.classList.add('empty');
            }
        });
    }

    /**
     * Skip the tutorial and go directly to the game
     */
    async skipTutorial() {
        if (!this.game.startSequence.isActive || this.game.state.started) {
            console.log('Tutorial not active or game already started');
            return;
        }
        
        console.log('Skipping tutorial...');
        
        // Clear any START sequence highlights
        this.clearStartGuide();
        
        // Complete the START sequence, skipping word processing since letters weren't placed
        await this.game.startSequence.complete(true);
        
        // Update tutorial UI state and hide button
        this.game.tutorialUIState = TutorialUIState.COMPLETED;
        this.updateTutorialUI();
        
        // Ensure preview remains visible after tutorial
        this.game.dom.preview.classList.add('visible');
    }

    /**
     * Update tutorial UI visibility based on tutorial state
     * Single source of truth for tutorial UI state
     */
    updateTutorialUI() {
        const isActive = this.game.tutorialUIState === TutorialUIState.ACTIVE;
        if (this.game.dom.skipTutorialBtn) {
            this.game.dom.skipTutorialBtn.style.display = isActive ? 'block' : 'none';
        }

        if (this.game.tutorialUIState === TutorialUIState.COMPLETED) {
            this.showGameplayUI();
        }
        
        if (FEATURES.DEBUG_ENABLED) {
            console.log(`Tutorial UI state: ${this.game.tutorialUIState}`);
        }
    }

    showGameplayUI() {
        if (this.game.dom.lettersRemainingContainer) {
            this.game.dom.lettersRemainingContainer.classList.add('visible');
        }
    }
}
