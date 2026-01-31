import { CONFIG, GameModes } from '../config.js';
import { LetterGenerator } from '../letter/LetterGenerator.js';
import { calculateIndex } from '../grid/gridUtils.js';

/**
 * ClearModeInitializer - Handles initialization of Clear Mode
 * Populates grid with ~50% random letters and manages the initial state
 */
export class ClearModeInitializer {
    /**
     * Populate grid with ~50% random letters
     * @param {GameState} state - Game state to populate
     * @param {LetterGenerator} letterGenerator - For generating random letters
     * @returns {Array} Array of populated cells: [{row, col, letter}, ...]
     */
    static populateGridWithLetters(state, letterGenerator) {
        const totalCells = CONFIG.GRID.ROWS * CONFIG.GRID.COLUMNS;
        const targetPopulatedCells = Math.floor(totalCells * CONFIG.GAME.CLEAR_MODE_CELL_PERCENTAGE);
        
        const grid = [];
        let populatedCount = 0;
        const attemptedPositions = new Set();
        
        // Generate random positions and letters
        while (populatedCount < targetPopulatedCells) {
            const col = Math.floor(Math.random() * CONFIG.GRID.COLUMNS);
            const row = Math.floor(Math.random() * CONFIG.GRID.ROWS);
            const cellKey = `${row}-${col}`;
            
            // Skip if already attempted or populated
            if (attemptedPositions.has(cellKey)) {
                continue;
            }
            attemptedPositions.add(cellKey);
            
            // Check if position is already populated
            if (grid.some(cell => cell.row === row && cell.col === col)) {
                continue;
            }
            
            const letter = letterGenerator.generateLetter();
            grid.push({ row, col, letter });
            populatedCount++;
        }
        
        return grid;
    }


    
    /**
     * Apply initial grid population to DOM
     * @param {HTMLElement} gameGrid - Grid container
     * @param {Array} populatedCells - Cells to populate
     */
    static applyGridPopulation(gameGrid, populatedCells) {
        populatedCells.forEach(({ row, col, letter }) => {
            const index = calculateIndex(row, col, CONFIG.GRID.COLUMNS);
            const square = gameGrid.children[index];
            
            if (square) {
                square.textContent = letter;
                square.classList.add('filled');
                square.dataset.letter = letter;
            }
        });
    }
    
    /**
     * Update GameState to reflect initial grid population
     * @param {GameState} state - State to update
     * @param {Array} populatedCells - Cells that were populated
     */
    static updateGameState(state, populatedCells) {
        // Count cells per column from the populated cells
        // We need to count how many cells are filled in each column
        // to properly track columnFillCounts
        const columnFill = Array(CONFIG.GRID.COLUMNS).fill(0);
        
        populatedCells.forEach(({ col }) => {
            columnFill[col]++;
        });
        
        state.columnFillCounts = columnFill;
        state.initialGridState = populatedCells;
        state.targetCellsToClear = populatedCells.length;
        state.cellsClearedCount = 0;
    }
    
    /**
     * Check if a grid configuration is solvable (has at least one possible word)
     * This is useful for validation but optional
     * @param {Array} populatedCells - Cells to check
     * @param {DictionaryManager} dictionary - Dictionary for word lookup
     * @returns {boolean} True if at least one word can be formed
     */
    static canFormWords(populatedCells, dictionary) {
        if (!populatedCells || populatedCells.length === 0) {
            return false;
        }
        
        // For now, just check if we have vowels and consonants
        const letters = populatedCells.map(cell => cell.letter);
        const hasVowel = letters.some(l => ['A', 'E', 'I', 'O', 'U'].includes(l));
        const hasConsonant = letters.some(l => !['A', 'E', 'I', 'O', 'U'].includes(l));
        
        return hasVowel && hasConsonant;
    }
}
