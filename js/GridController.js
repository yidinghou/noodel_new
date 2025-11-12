import { CONFIG } from './config.js';

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
            square.className = 'grid-square';
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
}
