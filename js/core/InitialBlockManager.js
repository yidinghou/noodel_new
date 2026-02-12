import { CONFIG } from '../config.js';
import { calculateIndex, calculateRowCol } from '../grid/gridUtils.js';

/**
 * InitialBlockManager - Handles pre-population of grid with "initial" blocks for Clear Mode
 * 
 * In Clear Mode, the grid starts ~50% populated with "initial" blocks.
 * These blocks have a special CSS class "initial" to distinguish them from user-generated tiles.
 * Words must contain at least one user-generated tile (non-initial) to be valid.
 */
export class InitialBlockManager {
    // Letter frequency based on English language usage (same as LetterGenerator)
    static letterFrequencies = [
        { letter: 'E', weight: 12.70 },
        { letter: 'T', weight: 9.06 },
        { letter: 'A', weight: 8.17 },
        { letter: 'O', weight: 7.51 },
        { letter: 'I', weight: 6.97 },
        { letter: 'N', weight: 6.75 },
        { letter: 'S', weight: 6.33 },
        { letter: 'H', weight: 6.09 },
        { letter: 'R', weight: 5.99 },
        { letter: 'D', weight: 4.25 },
        { letter: 'L', weight: 4.03 },
        { letter: 'C', weight: 2.78 },
        { letter: 'U', weight: 2.76 },
        { letter: 'M', weight: 2.41 },
        { letter: 'W', weight: 2.36 },
        { letter: 'F', weight: 2.23 },
        { letter: 'G', weight: 2.02 },
        { letter: 'Y', weight: 1.97 },
        { letter: 'P', weight: 1.93 },
        { letter: 'B', weight: 1.29 },
        { letter: 'V', weight: 0.98 },
        { letter: 'K', weight: 0.77 },
        { letter: 'J', weight: 0.15 },
        { letter: 'X', weight: 0.15 },
        { letter: 'Q', weight: 0.10 },
        { letter: 'Z', weight: 0.07 }
    ];

    /**
     * Get a random letter based on English frequency distribution
     * @returns {string} A random uppercase letter
     */
    static getRandomLetter() {
        // Build cumulative weights
        let sum = 0;
        const cumulativeWeights = this.letterFrequencies.map(item => {
            sum += item.weight;
            return { letter: item.letter, cumWeight: sum };
        });
        const totalWeight = sum;
        
        // Select letter based on weighted random
        const random = Math.random() * totalWeight;
        for (const item of cumulativeWeights) {
            if (random <= item.cumWeight) {
                return item.letter;
            }
        }
        
        // Fallback
        return this.letterFrequencies[0].letter;
    }

    /**
     * Pre-populate grid with initial blocks for Clear Mode
     * @param {GameState} gameState - The game state object
     * @param {DOMCache} dom - The DOM cache object
     * @returns {Array<Object>} Array of initial block data with positions and letters
     */
    static populateGridWithInitialBlocks(gameState, dom) {
        const initialBlocks = [];
        const totalCells = CONFIG.GRID.TOTAL_CELLS;
        const fillPercentage = CONFIG.GAME.CLEAR_MODE_INITIAL_FILL_PERCENTAGE;
        const cellsToFill = Math.floor(totalCells * fillPercentage);
        
        // Create array of random indices to populate
        const indicesToFill = this.getRandomIndices(totalCells, cellsToFill);
        
        // Generate letters for each index
        indicesToFill.forEach(index => {
            const letter = this.getRandomLetter();
            const { row, col } = calculateRowCol(index, CONFIG.GRID.COLUMNS);
            
            initialBlocks.push({
                index: index,
                row: row,
                col: col,
                letter: letter,
                isInitial: true
            });
            
            // Update game state column fill counts
            gameState.incrementColumnFill(col);
        });
        
        return initialBlocks;
    }
    
    /**
     * Apply initial blocks to the DOM
     * @param {HTMLElement} gridElement - The grid DOM element
     * @param {Array<Object>} initialBlocks - Array of initial block data
     */
    static applyInitialBlocksToDom(gridElement, initialBlocks) {
        initialBlocks.forEach(block => {
            const square = gridElement.querySelector(`[data-index="${block.index}"]`);
            if (square) {
                square.textContent = block.letter;
                square.classList.add('filled', 'initial'); // Add 'initial' class to distinguish
            }
        });
    }
    
    /**
     * Get random indices for grid population
     * Fisher-Yates shuffle to ensure random distribution
     * @param {number} total - Total number of cells
     * @param {number} count - Number of cells to select
     * @returns {Array<number>} Random indices
     */
    static getRandomIndices(total, count) {
        const indices = Array.from({ length: total }, (_, i) => i);
        
        // Fisher-Yates shuffle and take first 'count' elements
        for (let i = total - 1; i > total - count - 1; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        return indices.slice(total - count);
    }
    
    /**
     * Check if a tile at a given index is an initial block
     * @param {HTMLElement} gridElement - The grid DOM element
     * @param {number} index - The tile index
     * @returns {boolean} True if the tile is an initial block
     */
    static isInitialBlock(gridElement, index) {
        const square = gridElement.querySelector(`[data-index="${index}"]`);
        return square && square.classList.contains('initial');
    }
    
    /**
     * Check if a word contains at least one user-generated tile (non-initial)
     * @param {Array<number>} tileIndices - Array of tile indices in the word
     * @param {HTMLElement} gridElement - The grid DOM element
     * @returns {boolean} True if at least one tile is user-generated
     */
    static hasUserGeneratedTile(tileIndices, gridElement) {
        return tileIndices.some(index => !this.isInitialBlock(gridElement, index));
    }
}
