import { CONFIG } from '../config.js';

/**
 * LetterController class - Manages letter generation and preview display
 */
export class LetterController {
    constructor(gameState, domCache) {
        this.gameState = gameState;
        this.dom = domCache;
    }

    // Initialize next letters
    initialize() {
        this.gameState.nextLetters = [];
        for (let i = 0; i < CONFIG.GAME.PREVIEW_COUNT; i++) {
            if (this.gameState.currentLetterIndex < this.gameState.letterSequence.length) {
                this.gameState.nextLetters.push(this.gameState.letterSequence[this.gameState.currentLetterIndex]);
                this.gameState.currentLetterIndex++;
            } else {
                // No more letters available
                this.gameState.nextLetters.push('');
            }
        }
    }

    // Display next letters preview
    display() {
        this.dom.preview.innerHTML = '';
        
        this.gameState.nextLetters.forEach((letter, index) => {
            const letterBlock = document.createElement('div');
            letterBlock.className = 'block-base preview-letter-block';
            
            // Check if letter is empty (no more letters remaining)
            if (!letter || letter === '' || letter === null || letter === undefined) {
                letterBlock.classList.add('empty');
                // Don't set textContent - the ::after pseudo-element will show the dash
            } else {
                // Only add next-up styling if the letter is NOT empty
                if (index === 0) {
                    letterBlock.classList.add('next-up');
                }
                letterBlock.textContent = letter;
            }
            
            this.dom.preview.appendChild(letterBlock);
        });
    }

    // Show PREVIEW_START letters in preview tiles
    displayPreviewStart() {
        this.dom.preview.innerHTML = '';
        
        CONFIG.PREVIEW_START.LETTERS.forEach((letter, index) => {
            const letterBlock = document.createElement('div');
            letterBlock.className = 'block-base preview-letter-block';
            letterBlock.textContent = letter;
            
            // First letter gets next-up styling
            if (index === 0) {
                letterBlock.classList.add('next-up');
            }
            
            // Add data attribute for column positioning
            letterBlock.dataset.column = index;
            
            this.dom.preview.appendChild(letterBlock);
        });
        
        // Make preview visible
        this.dom.preview.classList.add('visible');
    }

    // Advance to next letter in sequence
    advance() {
        // Remove first letter and add new one at the end
        this.gameState.nextLetters.shift();
        
        // Check if we've reached the end of the letter sequence
        if (this.gameState.currentLetterIndex < this.gameState.letterSequence.length) {
            this.gameState.nextLetters.push(this.gameState.letterSequence[this.gameState.currentLetterIndex]);
            this.gameState.currentLetterIndex++;
        } else {
            // No more letters - push empty string
            this.gameState.nextLetters.push('');
        }
        
        // Update display
        this.display();
    }

    // Get the next letter to be played
    getNextLetter() {
        return this.gameState.nextLetters[0];
    }

    /**
     * Reset display - reinitialize and display preview letters
     * Called when game is reset
     */
    displayReset() {
        this.initialize();
        this.display();
    }
}
