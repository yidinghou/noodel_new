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
}
