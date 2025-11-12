/**
 * DOMCache class - Caches frequently accessed DOM elements
 */
export class DOMCache {
    constructor() {
        this.grid = document.getElementById('gameGrid');
        this.startBtn = document.getElementById('startBtn');
        this.muteBtn = document.getElementById('muteBtn');
        this.preview = document.getElementById('nextLettersPreview');
        this.wordsList = document.getElementById('wordsList');
        this.scoreValue = document.getElementById('scoreValue');
        this.lettersRemaining = document.getElementById('lettersRemaining');
        this.controls = document.querySelector('.controls');
        this.stats = document.querySelector('.stats');
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
