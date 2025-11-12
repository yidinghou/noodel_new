/**
 * ScoreController class - Manages scoring, words, and game progress
 */
export class ScoreController {
    constructor(gameState, domCache) {
        this.gameState = gameState;
        this.dom = domCache;
    }

    // Add word to the words list
    addWord(word, description) {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.innerHTML = `<strong>${word}</strong> <small>${description}</small>`;
        this.dom.wordsList.appendChild(wordItem);
        
        // Update score
        this.gameState.addToScore(word.length);
        this.dom.scoreValue.textContent = this.gameState.score;
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
