import { CONFIG } from './config.js';

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
            this.gameState.nextLetters.push(this.gameState.alphabet[this.gameState.currentLetterIndex % 26]);
            this.gameState.currentLetterIndex++;
        }
    }

    // Display next letters preview
    display() {
        this.dom.preview.innerHTML = '';
        
        this.gameState.nextLetters.forEach((letter, index) => {
            const letterBlock = document.createElement('div');
            letterBlock.className = 'preview-letter-block';
            if (index === 0) {
                letterBlock.classList.add('next-up');
            }
            letterBlock.textContent = letter;
            this.dom.preview.appendChild(letterBlock);
        });
    }

    // Advance to next letter in sequence
    advance() {
        // Remove first letter and add new one at the end
        this.gameState.nextLetters.shift();
        this.gameState.nextLetters.push(this.gameState.alphabet[this.gameState.currentLetterIndex % 26]);
        this.gameState.currentLetterIndex++;
        
        // Update display
        this.display();
    }

    // Get the next letter to be played
    getNextLetter() {
        return this.gameState.nextLetters[0];
    }
}
