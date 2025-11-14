import { CONFIG } from '../config.js';
import { FeatureFlags } from '../core/FeatureFlags.js';

/**
 * GridController class - Manages grid generation and interactions
 */
export class GridController {
    constructor(gameState, domCache) {
        this.gameState = gameState;
        this.dom = domCache;
    }

    // Generate the grid
    generate() {
        for (let i = 0; i < CONFIG.GRID.TOTAL_CELLS; i++) {
            const square = document.createElement('div');
            square.className = 'block-base grid-square';
            square.dataset.index = i;
            square.dataset.column = i % CONFIG.GRID.COLUMNS;
            square.dataset.row = Math.floor(i / CONFIG.GRID.COLUMNS);
            this.dom.grid.appendChild(square);
        }
    }

    // Add click handlers to all grid squares
    addClickHandlers(handler) {
        const squares = this.dom.getAllGridSquares();
        squares.forEach(square => {
            square.addEventListener('click', handler);
        });
    }

    // Handle grid square click
    handleSquareClick(e) {
        if (!this.gameState.started) return;
        
        const column = parseInt(e.target.dataset.column);
        
        // Validate column
        if (isNaN(column) || column < 0 || column >= CONFIG.GRID.COLUMNS) {
            console.error('Invalid column:', column);
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
                const currentIndex = row * CONFIG.GRID.COLUMNS + col;
                const currentSquare = this.dom.getGridSquare(currentIndex);
                
                // If current cell is empty, look for filled cells above it
                if (!currentSquare.classList.contains('filled')) {
                    // Search upwards for a filled cell
                    for (let searchRow = row - 1; searchRow >= 0; searchRow--) {
                        const searchIndex = searchRow * CONFIG.GRID.COLUMNS + col;
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
        for (let col = 0; col < CONFIG.GRID.COLUMNS; col++) {
            let count = 0;
            for (let row = CONFIG.GRID.ROWS - 1; row >= 0; row--) {
                const index = row * CONFIG.GRID.COLUMNS + col;
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

        // Iterate through the debug grid pattern
        for (let row = 0; row < CONFIG.GRID.ROWS; row++) {
            for (let col = 0; col < CONFIG.GRID.COLUMNS; col++) {
                const letter = CONFIG.DEBUG_GRID[row][col];
                
                if (letter && letter !== '') {
                    const index = row * CONFIG.GRID.COLUMNS + col;
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
}
