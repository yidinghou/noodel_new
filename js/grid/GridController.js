import { CONFIG } from '../config.js';
import { calculateIndex, calculateRowCol, isValidColumn } from './gridUtils.js';

/**
 * @typedef {Object} GridConfig
 * @property {number} rows - Number of rows in the grid
 * @property {number} columns - Number of columns in the grid
 * @property {number} totalCells - Total number of cells (rows * columns)
 */

/**
 * GridController class - Manages grid generation and interactions
 * 
 * Dependencies are injected via constructor for testability:
 * - gameState: Game state object with column tracking
 * - domCache: DOM element cache with grid accessors
 * - gridConfig: Grid dimensions (optional, defaults to CONFIG.GRID)
 */
export class GridController {
    /**
     * @param {Object} gameState - Game state with column fill tracking
     * @param {Object} domCache - DOM cache with grid element accessors
     * @param {GridConfig} [gridConfig] - Optional grid configuration (defaults to CONFIG.GRID)
     */
    constructor(gameState, domCache, gridConfig = null) {
        this.gameState = gameState;
        this.dom = domCache;
        this.clickHandler = null;
        
        // Normalize and validate the grid configuration, falling back to CONFIG.GRID if needed
        this.gridConfig = this._normalizeGridConfig(gridConfig);
    }

    /**
     * Normalize and validate an optional grid configuration object.
     * Ensures rows/columns are positive integers and totalCells is consistent.
     * 
     * @param {GridConfig|null} gridConfig
     * @returns {GridConfig}
     * @private
     */
    _normalizeGridConfig(gridConfig) {
        const defaultRows = CONFIG.GRID.ROWS;
        const defaultColumns = CONFIG.GRID.COLUMNS;

        let rows = gridConfig && typeof gridConfig.rows === 'number' && Number.isFinite(gridConfig.rows)
            ? gridConfig.rows
            : defaultRows;
        let columns = gridConfig && typeof gridConfig.columns === 'number' && Number.isFinite(gridConfig.columns)
            ? gridConfig.columns
            : defaultColumns;

        // Coerce to integers and enforce minimum of 1
        if (!Number.isInteger(rows) || rows <= 0) {
            rows = defaultRows;
        }
        if (!Number.isInteger(columns) || columns <= 0) {
            columns = defaultColumns;
        }

        const totalCells = rows * columns;

        return {
            rows,
            columns,
            totalCells
        };
    }

    /**
     * Factory method to create a GridController with default configuration
     * @param {Object} gameState - Game state object
     * @param {Object} domCache - DOM cache object
     * @returns {GridController} New GridController instance
     */
    static create(gameState, domCache) {
        return new GridController(gameState, domCache);
    }

    /**
     * Factory method to create a GridController with custom grid dimensions
     * Useful for testing or alternative grid sizes
     * @param {Object} gameState - Game state object
     * @param {Object} domCache - DOM cache object
     * @param {number} rows - Number of rows
     * @param {number} columns - Number of columns
     * @returns {GridController} New GridController instance
     */
    static createWithDimensions(gameState, domCache, rows, columns) {
        return new GridController(gameState, domCache, {
            rows,
            columns,
            totalCells: rows * columns
        });
    }

    // Generate the grid
    generate() {
        const { columns, totalCells } = this.gridConfig;
        
        for (let i = 0; i < totalCells; i++) {
            const square = document.createElement('div');
            square.className = 'block-base grid-square';
            square.dataset.index = i;
            
            const result = calculateRowCol(i, columns);
            if (result) {
                square.dataset.column = result.col;
                square.dataset.row = result.row;
            }
            
            this.dom.grid.appendChild(square);
        }
    }

    // Add click handlers to all grid squares
    addClickHandlers(handler) {
        // Remove old handlers first to prevent duplicates
        this.removeClickHandlers();
        
        // Store the handler reference
        this.clickHandler = handler;
        
        const squares = this.dom.getAllGridSquares();
        squares.forEach(square => {
            square.addEventListener('click', handler);
        });
    }

    // Remove click handlers from all grid squares
    removeClickHandlers() {
        if (!this.clickHandler) return;
        
        const squares = this.dom.getAllGridSquares();
        squares.forEach(square => {
            square.removeEventListener('click', this.clickHandler);
        });
    }

    // Handle grid square click
    handleSquareClick(e) {
        if (!this.gameState.started) return;
        
        const column = parseInt(e.target.dataset.column);
        
        // Validate column using injected config
        if (!isValidColumn(column, this.gridConfig.columns)) {
            return;
        }
        
        // Check if column is full
        if (this.gameState.isColumnFull(column)) return;
        
        // Return column to be processed by caller
        return column;
    }

    // Apply gravity - make letters fall down after cells are cleared
    applyGravity() {
        let moved = false;
        const { rows, columns } = this.gridConfig;
        
        // Process each column from bottom to top
        for (let col = 0; col < columns; col++) {
            // Start from bottom row and work upwards
            for (let row = rows - 1; row >= 0; row--) {
                const currentIndex = calculateIndex(row, col, columns);
                const currentSquare = this.dom.getGridSquare(currentIndex);
                
                // If current cell is empty, look for filled cells above it
                if (!currentSquare.classList.contains('filled')) {
                    // Search upwards for a filled cell
                    for (let searchRow = row - 1; searchRow >= 0; searchRow--) {
                        const searchIndex = calculateIndex(searchRow, col, columns);
                        const searchSquare = this.dom.getGridSquare(searchIndex);
                        
                        if (searchSquare.classList.contains('filled')) {
                            // Move the letter down
                            currentSquare.textContent = searchSquare.textContent;
                            currentSquare.classList.add('filled');
                            searchSquare.textContent = '';
                            searchSquare.classList.remove('filled');
                            moved = true;
                            break; // Found a letter to move, continue with next empty cell
                        }
                    }
                }
            }
        }
        
        // Update column fill counts
        this.updateColumnFillCounts();
        
        return moved;
    }

    // Update column fill counts based on actual grid state
    updateColumnFillCounts() {
        const { rows, columns } = this.gridConfig;
        
        for (let col = 0; col < columns; col++) {
            let count = 0;
            for (let row = rows - 1; row >= 0; row--) {
                const index = calculateIndex(row, col, columns);
                const square = this.dom.getGridSquare(index);
                if (square.classList.contains('filled')) {
                    count++;
                } else {
                    break; // Stop counting when we hit an empty cell
                }
            }
            this.gameState.columnFillCounts[col] = count;
        }
    }

    // Load debug grid pattern for testing (only in DEBUG mode)
    loadDebugGrid() {
        if (!FeatureFlags.isEnabled('debug.gridPattern') || !CONFIG.DEBUG_GRID) {
            return;
        }

        console.log('🔧 Loading debug grid pattern...');
        const { rows, columns } = this.gridConfig;

        // Iterate through the debug grid pattern
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const letter = CONFIG.DEBUG_GRID[row]?.[col];
                
                if (letter && letter !== '') {
                    const index = calculateIndex(row, col, columns);
                    const square = this.dom.getGridSquare(index);
                    
                    if (square) {
                        square.textContent = letter;
                        square.classList.add('filled');
                    }
                }
            }
        }

        // Update column fill counts to match the debug grid
        this.updateColumnFillCounts();
        
        console.log('✅ Debug grid loaded successfully');
    }

    // Start pulsating animation on all grid squares
    startPulsating() {
        const squares = this.dom.getAllGridSquares();
        squares.forEach(square => {
            square.classList.add('pulsating');
        });
    }

    // Stop pulsating animation on all grid squares
    stopPulsating() {
        const squares = this.dom.getAllGridSquares();
        squares.forEach(square => {
            square.classList.remove('pulsating');
        });
    }

    /**
     * Reset display - clear and regenerate the grid
     * Called when game is reset
     */
    displayReset() {
        // Remove click handlers before clearing
        this.removeClickHandlers();
        
        this.dom.grid.innerHTML = '';
        this.generate();
    }
}
