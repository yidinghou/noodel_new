import { WordItem } from '../word/WordItem.js';
import { CONFIG } from '../config.js';

/**
 * ScoreController class - Manages scoring, words, and game progress
 */
export class ScoreController {
    constructor(gameState, domCache) {
        this.gameState = gameState;
        this.dom = domCache;
        this.madeWords = []; // Store WordItem instances for stats
    }

    /**
     * Initialize display from config values
     * Called once when the game initializes
     */
    init() {
        // Set initial score from game state (starts negative to account for NOODEL)
        this.dom.scoreValue.textContent = this.gameState.score;
        
        // Set initial letters remaining from config
        if (this.dom.lettersRemainingValue) {
            this.dom.lettersRemainingValue.textContent = CONFIG.GAME.INITIAL_LETTERS;
        }
    }

    // Add word to the words list
    addWord(wordItem, addToScore = true) {
        // Store the word item for stats tracking
        this.madeWords.push(wordItem);

        // Create DOM element and display in format: Word (pts) Definition
        const wordDiv = document.createElement('div');
        wordDiv.className = 'word-item';
        wordDiv.innerHTML = `<strong>${wordItem.text}</strong> <small>(${wordItem.points} pts)</small> <span>${wordItem.definition}</span>`;

        // Insert at the top (prepend) so newest words appear first
        this.dom.wordsList.insertBefore(wordDiv, this.dom.wordsList.firstChild);

        // Update score if requested
        if (addToScore) {
            this.gameState.addToScore(wordItem.points);
            this.dom.scoreValue.textContent = this.gameState.score;
        }
    }

    // Get stats about all words made during the game
    getStats() {
        return {
            totalWords: this.madeWords.length,
            totalScore: this.gameState.score,
            words: this.madeWords.slice(), // copy of WordItem array
            longestWord: this.madeWords.reduce((a, b) => 
                a.text.length > b.text.length ? a : b, 
                new WordItem('', '', 0)
            )
        };
    }

    // Update letters remaining counter
    updateLettersRemaining() {
        this.gameState.decrementLettersRemaining();
        if (this.dom.lettersRemainingValue) {
            this.dom.lettersRemainingValue.textContent = this.gameState.lettersRemaining;
        }
        
        if (this.gameState.isGameOver()) {
            // Game over logic
            alert('Game Over! No more letters remaining.');
        }
    }

    /**
     * Reset display - clear words list and update score/letters display
     * Called when game is reset
     */
    displayReset() {
        this.madeWords = [];
        this.dom.wordsList.innerHTML = '';
        
        // Update score display
        this.dom.scoreValue.textContent = this.gameState.score;
        
        // Update letters remaining display from config
        if (this.dom.lettersRemainingValue) {
            this.dom.lettersRemainingValue.textContent = this.gameState.lettersRemaining;
        }
    }
}
