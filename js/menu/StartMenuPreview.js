import { CONFIG } from '../config.js';
import { AnimationHelpers } from '../animation/AnimationHelpers.js';

/**
 * StartMenuPreview class - Displays START in the letter preview area
 * Alternative to grid-based menu system
 * Shows "START" where S is the next-up letter (index 0)
 */
export class StartMenuPreview {
    constructor(domCache, onStart) {
        this.dom = domCache;
        this.onStart = onStart;
        this.isActive = false;
        this.clickHandlers = []; // Store handlers for cleanup
        
        // Use CONFIG for letters
        this.startLetters = CONFIG.START_MENU.LETTERS;
        
        // Load timing from CSS (following AnimationController pattern)
        this.timings = this.loadStartMenuTimings();
    }

    /**
     * Load START menu animation timings from CSS
     * Follows AnimationHelpers pattern
     */
    loadStartMenuTimings() {
        const root = getComputedStyle(document.documentElement);
        const parseTime = AnimationHelpers.parseTime;
        
        return {
            clickHighlight: parseTime(root.getPropertyValue('--animation-duration-start-click-highlight')),
            letterDrop: parseTime(root.getPropertyValue('--animation-delay-start-letter-drop')),
            wordPause: parseTime(root.getPropertyValue('--animation-delay-start-word-pause')),
            clearPause: parseTime(root.getPropertyValue('--animation-delay-start-clear-pause'))
        };
    }

    /**
     * Show START in the preview area
     */
    show() {
        this.isActive = true;
        this.droppedLetters = 0;
        
        // Get all preview blocks
        const previewBlocks = this.dom.preview.querySelectorAll('.preview-letter-block');
        
        if (previewBlocks.length !== CONFIG.GAME.PREVIEW_COUNT) {
            console.error(`Expected ${CONFIG.GAME.PREVIEW_COUNT} preview blocks, found ${previewBlocks.length}`);
            return;
        }
        
        // Display START with S at index 0 (next-up position)
        this.startLetters.forEach((letter, index) => {
            const block = previewBlocks[index];
            block.textContent = letter;
            
            // Add next-up styling to S (first letter) - it will get orange color automatically
            if (index === 0) {
                block.classList.add('next-up');
            }
            
            // Store reference for click handler
            block.dataset.startMenuLetter = letter;
            block.dataset.letterIndex = index;
        });
        
        // Make preview visible
        this.dom.preview.classList.add('visible');
        
        // Add click handlers
        this.addClickHandlers();
    }

    /**
     * Add click handlers to START letters
     */
    addClickHandlers() {
        const previewBlocks = this.dom.preview.querySelectorAll('.preview-letter-block');
        
        // Clear previous handlers
        this.clickHandlers.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
        });
        this.clickHandlers = [];
        
        previewBlocks.forEach(block => {
            if (block.dataset.startMenuLetter) {
                const handler = () => this.handleClick(block);
                block.addEventListener('click', handler);
                this.clickHandlers.push({ element: block, handler });
            }
        });
    }

    /**
     * Handle click on any START letter - triggers the animation sequence
     */
    handleClick(clickedBlock) {
        if (!this.isActive) return;
        
        console.log('START clicked in preview');
        this.isActive = false; // Prevent further clicks
        
        // Remove click handlers
        this.clickHandlers.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
        });
        this.clickHandlers = [];
        
        // Trigger the onStart callback which will run the animation sequence
        if (this.onStart) {
            this.onStart();
        }
    }

    /**
     * Drop each START letter sequentially into columns 0-4
     * Called by AnimationSequencer
     */
    async dropStartLettersSequence(animator, letterController) {
        const targetRow = CONFIG.GRID.ROWS - 1; // Bottom row
        
        // Drop each letter sequentially
        for (let i = 0; i < this.startLetters.length; i++) {
            const letter = this.startLetters[i];
            const column = CONFIG.START_MENU.COLUMNS[i];
            
            // Simulate click using AnimationController helper
            await animator.highlightGridSquare(column, 'column-clicked');
            
            // Drop letter
            await new Promise(resolve => {
                animator.dropLetterInColumn(column, letter, targetRow, resolve);
            });
            
            // Update preview with next letters
            this.updatePreviewAfterDrop(i, letterController);
            
            // Wait before next drop (using timing from CSS)
            if (i < this.startLetters.length - 1) {
                await new Promise(resolve => setTimeout(resolve, this.timings.letterDrop));
            }
        }
        
        // Pause to show complete word
        await new Promise(resolve => setTimeout(resolve, this.timings.wordPause));
        
        // Animate word found (highlight and shake)
        const positions = this.getStartWordPositions();
        await animator.highlightAndShakeWord(positions);
        
        // Clear the word
        animator.clearWordCells(positions);
        await new Promise(resolve => setTimeout(resolve, this.timings.clearPause));
    }

    /**
     * Get positions for START word in grid
     */
    getStartWordPositions() {
        const positions = [];
        const targetRow = CONFIG.GRID.ROWS - 1; // Bottom row
        
        CONFIG.START_MENU.COLUMNS.forEach(col => {
            const index = targetRow * CONFIG.GRID.COLUMNS + col;
            positions.push({ index, row: targetRow, col });
        });
        
        return positions;
    }

    /**
     * Update preview after a letter drop - shift remaining START letters and add next game letter
     */
    updatePreviewAfterDrop(droppedIndex, letterController) {
        const previewBlocks = this.dom.preview.querySelectorAll('.preview-letter-block');
        const remainingStartLetters = this.startLetters.length - droppedIndex - 1;
        
        // Update all preview blocks
        for (let i = 0; i < CONFIG.GAME.PREVIEW_COUNT; i++) {
            const block = previewBlocks[i];
            
            if (i < remainingStartLetters) {
                // Remaining START letters (not yet dropped)
                const letterIndex = droppedIndex + 1 + i;
                block.textContent = this.startLetters[letterIndex];
                block.dataset.startMenuLetter = this.startLetters[letterIndex];
                
                // First letter gets next-up styling
                if (i === 0) {
                    block.classList.add('next-up');
                } else {
                    block.classList.remove('next-up');
                }
            } else {
                // Fill with next game letters from the sequence
                const gameLetterOffset = i - remainingStartLetters;
                const gameLetter = letterController.gameState.letterSequence[gameLetterOffset];
                
                if (gameLetter) {
                    block.textContent = gameLetter;
                    block.classList.remove('next-up');
                    delete block.dataset.startMenuLetter;
                } else {
                    block.textContent = '';
                    block.classList.add('empty');
                    block.classList.remove('next-up');
                    delete block.dataset.startMenuLetter;
                }
            }
        }
    }

    /**
     * Hide the START menu
     */
    hide() {
        this.isActive = false;
        
        // Remove click handlers
        this.clickHandlers.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
        });
        this.clickHandlers = [];
        
        const previewBlocks = this.dom.preview.querySelectorAll('.preview-letter-block');
        
        previewBlocks.forEach(block => {
            block.textContent = '';
            block.classList.remove('next-up');
            delete block.dataset.startMenuLetter;
            delete block.dataset.letterIndex;
        });
    }

    /**
     * Check if menu is currently active
     */
    isMenuActive() {
        return this.isActive;
    }
}
