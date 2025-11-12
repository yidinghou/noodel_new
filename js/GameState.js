import { CONFIG } from './config.js';
import { LetterGenerator } from './LetterGenerator.js';

/**
 * GameState class - Manages all game state data
 */
export class GameState {
    constructor() {
        // Game flow state
        this.started = false;
        
        // Score tracking
        this.score = 0;
        
        // Letter management
        this.letterSequence = this.generateLetterSequence();  // The actual 100-letter sequence
        this.currentLetterIndex = 0;
        this.lettersRemaining = CONFIG.GAME.INITIAL_LETTERS;
        this.nextLetters = [];  // Preview queue (4 upcoming letters)
        
        // Grid state
        this.columnFillCounts = Array(CONFIG.GRID.COLUMNS).fill(0);
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
        
        // Score tracking
        this.score = 0;
        
        // Letter management - generate fresh sequence
        this.letterSequence = this.generateLetterSequence();
        this.currentLetterIndex = 0;
        this.lettersRemaining = CONFIG.GAME.INITIAL_LETTERS;
        this.nextLetters = [];
        
        // Grid state
        this.columnFillCounts = Array(CONFIG.GRID.COLUMNS).fill(0);
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
