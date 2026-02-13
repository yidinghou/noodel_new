import { CONFIG, GameModes } from '../config.js';
import { LetterGenerator } from '../letter/LetterGenerator.js';
import { calculateWordScore } from '../scoring/ScoringUtils.js';

/**
 * GameState class - Manages all game state data
 */
export class GameState {
    constructor(gameMode = GameModes.CLASSIC) {
        // Game flow state
        this.started = false;
        this.isFirstLoad = true; // Track if this is the first load (shows NOODEL overlay) vs a reset
        
        // Game mode
        this.gameMode = gameMode;
        
        // Score tracking
        // Do not apply a hardcoded NOODEL offset here; scoring is controlled
        // by `scoringEnabled` which starts disabled during the START sequence.
        this.score = 0;
        this.scoringEnabled = false;
        
        // Letter management
        this.letterSequence = this.generateLetterSequence();  // The actual 100-letter sequence
        this.currentLetterIndex = 0;
        this.lettersRemaining = CONFIG.GAME.INITIAL_LETTERS;
        this.nextLetters = [];  // Preview queue (4 upcoming letters)
        
        // Grid state
        this.columnFillCounts = Array(CONFIG.GRID.COLUMNS).fill(0);
        this.pendingColumnCounts = Array(CONFIG.GRID.COLUMNS).fill(0);  // Tracks in-flight tiles
        
        // Clear Mode specific state
        this.initialBlockCount = 0;  // Number of initial blocks placed at start of clear mode
        this.clearedInitialBlocks = 0;  // Number of initial blocks that have been cleared
    }

    /**
     * Generate a new letter sequence using weighted random letters
     * @returns {string} Letter sequence of 100 letters
     */
    generateLetterSequence() {
        // Create a new LetterGenerator instance for this sequence
        const generator = new LetterGenerator(CONFIG.GAME.INITIAL_LETTERS);
        
        // Generate all letters at once
        const lettersArray = generator.generateAllLetters();
        const sequence = lettersArray.join('');
        
        // Log statistics in debug mode
        if (CONFIG.DEBUG) {
            const stats = this.getSequenceStats(sequence);
            console.log('🎲 Generated new letter sequence:');
            console.log(`   Total: ${stats.totalLetters} letters`);
            console.log(`   Unique: ${stats.uniqueLetters} different letters`);
            console.log('   Top 5 most frequent:');
            stats.topLetters.forEach(({ letter, count, percentage }) => {
                console.log(`     ${letter}: ${count} (${percentage}%)`);
            });
        }
        
        return sequence;
    }

    /**
     * Get statistics about a letter sequence
     * @param {string} sequence - The letter sequence to analyze
     * @returns {Object} Statistics object
     */
    getSequenceStats(sequence) {
        const letterCounts = {};
        
        // Count each letter
        for (const letter of sequence) {
            letterCounts[letter] = (letterCounts[letter] || 0) + 1;
        }
        
        // Get top letters sorted by frequency
        const topLetters = Object.entries(letterCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([letter, count]) => ({
                letter,
                count,
                percentage: ((count / sequence.length) * 100).toFixed(1)
            }));
        
        return {
            totalLetters: sequence.length,
            uniqueLetters: Object.keys(letterCounts).length,
            topLetters
        };
    }

    reset() {
        // Game flow state
        this.started = false;
        this.isFirstLoad = false; // After first reset, we're no longer in first load
        
        // Game mode stays the same, just reset with current mode
        
        // Score tracking
        this.score = 0;
        this.scoringEnabled = false;
        
        // Letter management - generate fresh sequence
        this.letterSequence = this.generateLetterSequence();
        this.currentLetterIndex = 0;
        this.lettersRemaining = CONFIG.GAME.INITIAL_LETTERS;
        this.nextLetters = [];
        
        // Grid state
        this.columnFillCounts = Array(CONFIG.GRID.COLUMNS).fill(0);
        this.pendingColumnCounts = Array(CONFIG.GRID.COLUMNS).fill(0);
        
        // Clear Mode specific state - reset for new game
        this.initialBlockCount = 0;
        this.clearedInitialBlocks = 0;
    }

    isColumnFull(column) {
        const totalFill = this.columnFillCounts[column] + this.pendingColumnCounts[column];
        return totalFill >= CONFIG.GRID.ROWS;
    }

    getLowestAvailableRow(column) {
        return CONFIG.GRID.ROWS - 1 - this.columnFillCounts[column];
    }

    getLowestAvailableRowWithPending(column) {
        const totalFill = this.columnFillCounts[column] + this.pendingColumnCounts[column];
        return CONFIG.GRID.ROWS - 1 - totalFill;
    }

    incrementColumnFill(column) {
        this.columnFillCounts[column]++;
    }

    incrementPendingFill(column) {
        this.pendingColumnCounts[column]++;
    }

    decrementPendingFill(column) {
        if (this.pendingColumnCounts[column] > 0) {
            this.pendingColumnCounts[column]--;
        }
    }

    decrementLettersRemaining() {
        this.lettersRemaining--;
    }

    addToScore(points) {
        this.score += points;
    }

    isGameOver() {
        // Classic mode: game over when no letters remain
        if (this.gameMode === GameModes.CLASSIC) {
            return this.lettersRemaining <= 0;
        }

        // Clear mode: game over when no letters remain
        // (Victory conditions are checked separately)
        return this.lettersRemaining <= 0;
    }

    /**
     * Check if clear mode is complete (all initial blocks cleared)
     * @returns {boolean} True if all initial blocks have been cleared
     */
    isClearModeComplete() {
        return this.gameMode === GameModes.CLEAR &&
               this.initialBlockCount > 0 &&
               this.clearedInitialBlocks >= this.initialBlockCount;
    }

    /**
     * Check if there are any initial blocks remaining on the board
     * This is a DOM-based check to verify actual state
     * @param {HTMLElement} gridElement - The grid DOM element
     * @returns {boolean} True if any initial blocks remain
     */
    hasInitialBlocksRemaining(gridElement) {
        if (this.gameMode !== GameModes.CLEAR) {
            return false;
        }

        const initialBlocks = gridElement.querySelectorAll('.initial');
        return initialBlocks.length > 0;
    }

    /**
     * Check if the board is completely empty
     * @param {HTMLElement} gridElement - The grid DOM element
     * @returns {boolean} True if no filled squares exist
     */
    isBoardEmpty(gridElement) {
        const filledSquares = gridElement.querySelectorAll('.filled');
        return filledSquares.length === 0;
    }

    /**
     * Increment cleared initial blocks counter
     * @param {number} count - Number of initial blocks cleared (default: 1)
     */
    incrementClearedInitialBlocks(count = 1) {
        this.clearedInitialBlocks += count;
    }
}
