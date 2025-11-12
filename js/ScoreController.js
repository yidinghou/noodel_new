import { WordItem } from './WordItem.js';

/**
 * ScoreController class - Manages scoring, words, and game progress
 */
export class ScoreController {
    constructor(gameState, domCache) {
        this.gameState = gameState;
        this.dom = domCache;
        this.madeWords = []; // Store WordItem instances for stats
    }

    // Add word to the words list
    addWord(wordItem) {
        // Store the word item for stats tracking
        this.madeWords.push(wordItem);
        
        // Create DOM element and display in format: Word (pts) Definition
        const wordDiv = document.createElement('div');
        wordDiv.className = 'word-item';
        wordDiv.innerHTML = `<strong>${wordItem.text}</strong> <small>(${wordItem.points} pts)</small> <span>${wordItem.definition}</span>`;
        
        // Insert at the top (prepend) so newest words appear first
        this.dom.wordsList.insertBefore(wordDiv, this.dom.wordsList.firstChild);
        
        // Update score
        this.gameState.addToScore(wordItem.points);
        this.dom.scoreValue.textContent = this.gameState.score;
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
        this.dom.lettersRemaining.textContent = this.gameState.lettersRemaining;
        
        if (this.gameState.isGameOver()) {
            // Game over logic
            alert('Game Over! No more letters remaining.');
        }
    }
}
