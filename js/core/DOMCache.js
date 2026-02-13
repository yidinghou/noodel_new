/**
 * DOMCache class - Caches frequently accessed DOM elements
 */
export class DOMCache {
    constructor() {
        this.grid = document.getElementById('gameGrid');
        this.gridWrapper = document.querySelector('.game-grid-wrapper');
        this.startBtn = document.getElementById('startBtn');
        this.muteBtn = document.getElementById('muteBtn');
        this.preview = document.getElementById('nextLettersPreview');
        this.wordsList = document.getElementById('wordsList');
        this.scoreValue = document.getElementById('scoreValue');
        this.lettersRemainingContainer = document.getElementById('gameGridLettersRemaining');
        this.lettersRemainingValue = this.lettersRemainingContainer?.querySelector('.letters-remaining-value');
        this.controls = document.querySelector('.controls');
        this.stats = document.querySelector('.stats');
        this.skipTutorialBtn = document.getElementById('skipTutorialBtn');
        this.madeWordsContainer = document.querySelector('.made-words-container');
    }

    getAllGridSquares() {
        return document.querySelectorAll('.grid-square');
    }

    getGridSquare(index) {
        return document.querySelector(`.grid-square[data-index="${index}"]`);
    }

    getTitleLetterBlocks() {
        return document.querySelectorAll('.letter-block');
    }

    getNextUpBlock() {
        return document.querySelector('.preview-letter-block.next-up');
    }

    /**
     * Remove grid square state classes
     * Centralizes class removal to ensure consistency when clearing word/animation states
     * Removes filled state and all animation/word-related classes
     * @param {HTMLElement|number} squareOrIndex - Grid square element or data-index
     */
    removeGridSquareStateClasses(squareOrIndex) {
        const square = typeof squareOrIndex === 'number'
            ? this.getGridSquare(squareOrIndex)
            : squareOrIndex;

        if (!square) return;

        // Remove all state classes: filled state, word states, animation states, and initial blocks
        // Note: Does NOT remove 'grid-square' base class
        square.classList.remove(
            'filled',           // Base filled state
            'word-found',       // Word animation state
            'word-pending',     // Grace period state
            'celebrate',        // Victory animation
            'reveal',           // Reveal animation
            'initial',          // Clear mode pre-populated block
            'pulsating'         // Highlight/focus state
        );
    }
}
