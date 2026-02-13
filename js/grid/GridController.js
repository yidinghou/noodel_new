import { CONFIG } from '../config.js';
import { calculateIndex, calculateRowCol, isValidColumn } from './gridUtils.js';
import { FEATURES } from '../core/features.js';
import { InitialBlockManager } from '../core/InitialBlockManager.js';


/**
 * GridController class - Manages grid generation and interactions
 */
export class GridController {
    constructor(gameState, domCache) {
        this.gameState = gameState;
        this.dom = domCache;
        this.clickHandler = null;
    }

    // Generate the grid
    generate() {
        for (let i = 0; i < CONFIG.GRID.TOTAL_CELLS; i++) {
            const square = document.createElement('div');
            square.className = 'block-base grid-square';
            square.dataset.index = i;
            
            const { row, col } = calculateRowCol(i, CONFIG.GRID.COLUMNS);
            square.dataset.column = col;
            square.dataset.row = row;
            
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
        
        // Validate column
        if (!isValidColumn(column, CONFIG.GRID.COLUMNS)) {
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
        
        // Process each column from bottom to top
        for (let col = 0; col < CONFIG.GRID.COLUMNS; col++) {
            // Start from bottom row and work upwards
            for (let row = CONFIG.GRID.ROWS - 1; row >= 0; row--) {
                const currentIndex = calculateIndex(row, col, CONFIG.GRID.COLUMNS);
                const currentSquare = this.dom.getGridSquare(currentIndex);
                
                // If current cell is empty, look for filled cells above it
                if (!currentSquare.classList.contains('filled')) {
                    // Search upwards for a filled cell
                    for (let searchRow = row - 1; searchRow >= 0; searchRow--) {
                        const searchIndex = calculateIndex(searchRow, col, CONFIG.GRID.COLUMNS);
                        const searchSquare = this.dom.getGridSquare(searchIndex);
                        
                        if (searchSquare.classList.contains('filled')) {
                            // Move the letter down
                            currentSquare.textContent = searchSquare.textContent;
                            currentSquare.classList.add('filled');
                            
                            // Preserve 'initial' class if it exists
                            if (searchSquare.classList.contains('initial')) {
                                currentSquare.classList.add('initial');
                            } else {
                                currentSquare.classList.remove('initial');
                            }
                            
                            searchSquare.textContent = '';
                            this.dom.removeGridSquareStateClasses(searchSquare);
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
        const oldCounts = [...this.gameState.columnFillCounts];
        for (let col = 0; col < CONFIG.GRID.COLUMNS; col++) {
            let count = 0;
            for (let row = CONFIG.GRID.ROWS - 1; row >= 0; row--) {
                const index = calculateIndex(row, col, CONFIG.GRID.COLUMNS);
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
     * Initialize clear mode with pre-populated initial blocks
     * @param {GameState} gameState - The game state object
     */
    initializeClearMode(gameState) {
        // Clear any existing grid content first
        this.displayReset();
        
        // Reset column fill counts
        gameState.columnFillCounts = new Array(CONFIG.GRID.COLUMNS).fill(0);
        
        // Populate grid with initial blocks
        const initialBlocks = InitialBlockManager.populateGridWithInitialBlocks(gameState, this.dom);
        
        // Apply initial blocks to DOM
        InitialBlockManager.applyInitialBlocksToDom(this.dom.grid, initialBlocks);
        
        // Apply gravity to make initial blocks fall to bottom
        this.applyGravity();
        
        console.log(`Clear Mode initialized: ${initialBlocks.length} initial blocks placed`);
        
        return initialBlocks;
    }

    /**
     * pPulsating() {
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
