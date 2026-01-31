import { CONFIG } from '../config.js';
import { DictionaryManager } from './DictionaryManager.js';
import { calculateIndex } from '../grid/gridUtils.js';

/**
 * WordResolver class - Detects and validates words on the game grid
 */
export class WordResolver {
    constructor(gameState, domCache, dictionary) {
        this.gameState = gameState;
        this.dom = domCache;
        this.dictionary = dictionary;
    }

    /**
     * Factory method to create a WordResolver with loaded dictionary
     * @param {Object} gameState - The game state object
     * @param {Object} domCache - The DOM cache object
     * @returns {Promise<WordResolver>} A WordResolver instance with loaded dictionary
     */
    static async create(gameState, domCache) {
        const dictionary = await DictionaryManager.loadDictionaries();
        return new WordResolver(gameState, domCache, dictionary);
    }

    /**
     * Check the entire grid for words after a letter is placed
     * Returns an array of found words with their positions
     */
    checkForWords() {
        const foundWords = [];
        
        // Check horizontal words
        foundWords.push(...this.checkHorizontal());
        
        // Check vertical words
        foundWords.push(...this.checkVertical());
        
        // Check diagonal words (both directions)
        foundWords.push(...this.checkDiagonals());
        
        return foundWords;
    }

    /**
     * Check for horizontal words (left to right)
     */
    checkHorizontal() {
        const words = [];
        
        for (let row = 0; row < CONFIG.GRID.ROWS; row++) {
            for (let col = 0; col < CONFIG.GRID.COLUMNS; col++) {
                // Try words of different lengths starting from this position
                for (let length = 3; length <= CONFIG.GRID.COLUMNS - col; length++) {
                    const wordData = this.extractWord(row, col, 0, 1, length);
                    if (wordData && this.dictionary.has(wordData.word)) {
                        words.push(wordData);
                    }
                }
            }
        }
        
        return this.filterOverlappingWords(words);
    }

    /**
     * Check for vertical words (top to bottom)
     */
    checkVertical() {
        const words = [];
        
        for (let col = 0; col < CONFIG.GRID.COLUMNS; col++) {
            for (let row = 0; row < CONFIG.GRID.ROWS; row++) {
                // Try words of different lengths starting from this position
                for (let length = 3; length <= CONFIG.GRID.ROWS - row; length++) {
                    const wordData = this.extractWord(row, col, 1, 0, length);
                    if (wordData && this.dictionary.has(wordData.word)) {
                        words.push(wordData);
                    }
                }
            }
        }
        
        return this.filterOverlappingWords(words);
    }

    /**
     * Check for diagonal words (both directions)
     */
    checkDiagonals() {
        const words = [];
        
        // Diagonal down-right
        for (let row = 0; row < CONFIG.GRID.ROWS; row++) {
            for (let col = 0; col < CONFIG.GRID.COLUMNS; col++) {
                const maxLength = Math.min(
                    CONFIG.GRID.ROWS - row,
                    CONFIG.GRID.COLUMNS - col
                );
                for (let length = 3; length <= maxLength; length++) {
                    const wordData = this.extractWord(row, col, 1, 1, length);
                    if (wordData && this.dictionary.has(wordData.word)) {
                        words.push(wordData);
                    }
                }
            }
        }
        
        // Diagonal up-right (starting from bottom rows, moving up-right)
        for (let row = 0; row < CONFIG.GRID.ROWS; row++) {
            for (let col = 0; col < CONFIG.GRID.COLUMNS; col++) {
                const maxLength = Math.min(
                    row + 1,  // Can go up from current row
                    CONFIG.GRID.COLUMNS - col  // Can go right from current column
                );
                for (let length = 3; length <= maxLength; length++) {
                    const wordData = this.extractWord(row, col, -1, 1, length);
                    if (wordData && this.dictionary.has(wordData.word)) {
                        words.push(wordData);
                    }
                }
            }
        }
        
        return this.filterOverlappingWords(words);
    }

    /**
     * Extract a word from the grid at the specified position and direction
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {number} rowDelta - Row direction (0, 1, or -1)
     * @param {number} colDelta - Column direction (0, 1, or -1)
     * @param {number} length - Length of word to extract
     * @returns {object|null} Word data object or null if invalid
     */
    extractWord(row, col, rowDelta, colDelta, length) {
        let word = '';
        const positions = [];
        
        for (let i = 0; i < length; i++) {
            const currentRow = row + (i * rowDelta);
            const currentCol = col + (i * colDelta);
            const index = calculateIndex(currentRow, currentCol, CONFIG.GRID.COLUMNS);
            const square = this.dom.getGridSquare(index);
            
            if (!square || !square.classList.contains('filled')) {
                return null; // Empty cell or out of bounds
            }
            
            word += square.textContent;
            positions.push({ row: currentRow, col: currentCol, index });
        }
        
        // Fetch definition from dictionary (or use placeholder if not found)
        const definition = this.dictionary.get(word) || 'No definition available';
        
        return {
            word,
            positions,
            direction: this.getDirectionName(rowDelta, colDelta),
            definition
        };
    }

    /**
     * Get human-readable direction name
     */
    getDirectionName(rowDelta, colDelta) {
        if (rowDelta === 0 && colDelta === 1) return 'horizontal';
        if (rowDelta === 1 && colDelta === 0) return 'vertical';
        if (rowDelta === 1 && colDelta === 1) return 'diagonal-down-right';
        if (rowDelta === -1 && colDelta === 1) return 'diagonal-up-right';
        return 'unknown';
    }

    /**
     * Filter overlapping words - keep only the longest word from overlapping sets
     */
    filterOverlappingWords(words) {
        if (words.length === 0) return words;
        
        // Sort by length (longest first)
        words.sort((a, b) => b.word.length - a.word.length);
        
        const filtered = [];
        const usedPositions = new Set();
        
        for (const wordData of words) {
            // Check if any position is already used
            const hasOverlap = wordData.positions.some(pos => 
                usedPositions.has(`${pos.row},${pos.col}`)
            );
            
            if (!hasOverlap) {
                filtered.push(wordData);
                // Mark positions as used
                wordData.positions.forEach(pos => {
                    usedPositions.add(`${pos.row},${pos.col}`);
                });
            }
        }
        
        return filtered;
    }
}
