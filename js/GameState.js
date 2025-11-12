import { CONFIG } from './config.js';

/**
 * GameState class - Manages all game state data
 */
export class GameState {
    constructor() {
        this.started = false;
        this.currentLetterIndex = 0;
        this.lettersRemaining = CONFIG.GAME.INITIAL_LETTERS;
        this.score = 0;
        this.columnFillCounts = Array(CONFIG.GRID.COLUMNS).fill(0);
        this.nextLetters = [];
        this.alphabet = CONFIG.GAME.ALPHABET;
    }

    reset() {
        this.started = false;
        this.currentLetterIndex = 0;
        this.lettersRemaining = CONFIG.GAME.INITIAL_LETTERS;
        this.score = 0;
        this.columnFillCounts = Array(CONFIG.GRID.COLUMNS).fill(0);
        this.nextLetters = [];
    }

    isColumnFull(column) {
        return this.columnFillCounts[column] >= CONFIG.GRID.ROWS;
    }

    getLowestAvailableRow(column) {
        return CONFIG.GRID.ROWS - 1 - this.columnFillCounts[column];
    }

    incrementColumnFill(column) {
        this.columnFillCounts[column]++;
    }

    decrementLettersRemaining() {
        this.lettersRemaining--;
    }

    addToScore(points) {
        this.score += points;
    }

    isGameOver() {
        return this.lettersRemaining <= 0;
    }
}
