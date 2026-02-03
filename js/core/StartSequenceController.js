import { CONFIG } from '../config.js';
import { isWithinBounds } from '../grid/gridUtils.js';

/**
 * StartSequenceController - Manages the guided START letter placement sequence
 * Encapsulates all START sequence logic for better separation of concerns
 */
export class StartSequenceController {
    constructor(game) {
        this.game = game;
        this.currentIndex = 0;
        this.isActive = false;
    }

    /**
     * Get the PREVIEW_START config
     */
    get config() {
        return CONFIG.PREVIEW_START;
    }

    /**
     * Start the START sequence
     */
    start() {
        this.currentIndex = 0;
        this.isActive = true;
        this.game.pauseWordDetection();
        console.log('START sequence activated');
    }

    /**
     * Get the expected position for the current letter
     * @returns {Object} {column, row}
     */
    getCurrentExpectedPosition() {
        // Use per-letter ROWS array (required to be defined)
        const row = this.config.ROWS[this.currentIndex];

        return {
            column: this.config.POSITIONS[this.currentIndex],
            row: row
        };
    }

    /**
     * Get the current letter to place
     * @returns {string}
     */
    getCurrentLetter() {
        return this.config.LETTERS[this.currentIndex];
    }

    /**
     * Validate if a click is at the expected position
     * @param {number} column - Grid column clicked
     * @param {number} row - Grid row clicked
     * @returns {boolean}
     */
    isValidClick(column, row) {
        const expected = this.getCurrentExpectedPosition();
        return column === expected.column && row === expected.row;
    }

    /**
     * Check if we're at the last letter in the sequence
     * @returns {boolean}
     */
    isLastLetter() {
        return this.currentIndex >= this.config.LETTERS.length - 1;
    }

    /**
     * Advance to the next letter in sequence
     */
    advance() {
        this.currentIndex++;
    }

    /**
     * Complete the START sequence and initialize game
     */
    async complete() {
        this.isActive = false;
        this.game.resumeWordDetection();

        // Process the completion word using configured settings
        if (this.game.features.isEnabled('wordDetection')) {
            await this.game.checkAndProcessWords(this.config.ADD_TO_SCORE);
        }

        // Trigger game start if configured
        if (this.config.TRIGGER_GAME_START) {
            await this.game.initializeGameAfterStartSequence();
        }
    }

    /**
     * Validate the complete config for consistency
     * @returns {Object} Validation result: {isValid: boolean, errors: string[]}
     */
    validateConfig() {
        const errors = [];

        if (this.config.LETTERS.length !== CONFIG.GAME.PREVIEW_COUNT) {
            errors.push(
                `LETTERS.length (${this.config.LETTERS.length}) !== PREVIEW_COUNT (${CONFIG.GAME.PREVIEW_COUNT})`
            );
        }

        if (this.config.POSITIONS.length !== this.config.LETTERS.length) {
            errors.push(
                `POSITIONS.length (${this.config.POSITIONS.length}) !== LETTERS.length (${this.config.LETTERS.length})`
            );
        }

        // Validate ROWS is defined and has correct length
        if (!Array.isArray(this.config.ROWS) || this.config.ROWS.length !== this.config.LETTERS.length) {
            errors.push(
                `ROWS must be an array with length ${this.config.LETTERS.length} (got ${Array.isArray(this.config.ROWS) ? this.config.ROWS.length : 'not an array'})`
            );
            return { isValid: false, errors };
        }

        // Validate all positions and rows are within grid bounds
        this.config.POSITIONS.forEach((col, index) => {
            const row = this.config.ROWS[index];

            if (!isWithinBounds(row, col, CONFIG.GRID.ROWS, CONFIG.GRID.COLUMNS)) {
                errors.push(
                    `LETTER[${index}] (row ${row}, col ${col}) is out of grid bounds`
                );
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}
