import { CONFIG } from './config.js';

/**
 * AnimationController class - Handles all game animations
 */
export class AnimationController {
    constructor(domCache) {
        this.dom = domCache;
    }

    // Randomize NOODEL title letter animation delays
    randomizeTitleLetterAnimations() {
        return new Promise((resolve) => {
            const letterBlocks = this.dom.getTitleLetterBlocks();
            const interval = CONFIG.ANIMATION.TITLE_DROP_INTERVAL;
            
            // Create array of indices and shuffle it
            const indices = Array.from({ length: letterBlocks.length }, (_, i) => i);
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            
            // Assign delays based on shuffled order
            indices.forEach((originalIndex, dropOrder) => {
                const delay = dropOrder * interval;
                letterBlocks[originalIndex].style.animationDelay = `${delay}s`;
            });
            
            // Find the latest animation end time
            const maxDelay = (letterBlocks.length - 1) * interval;
            const dropDuration = CONFIG.ANIMATION.TITLE_DROP_DURATION;
            const lastDropEnd = (maxDelay + dropDuration) * 1000; // Convert to ms
            
            // Resolve promise when animation completes
            setTimeout(resolve, lastDropEnd);
        });
    }

    // Apply color change and shake to all title letters simultaneously
    shakeAllTitleLetters() {
        return new Promise((resolve) => {
            const letterBlocks = this.dom.getTitleLetterBlocks();
            
            // Change all letters to green and trigger shake at the same time
            letterBlocks.forEach(block => {
                block.style.backgroundColor = CONFIG.COLORS.TITLE_ACTIVE;
                block.style.animationDelay = '0s'; // Reset delay so all shake together
                block.classList.add('shaking');
            });
            
            // Resolve promise when shake completes
            setTimeout(resolve, CONFIG.ANIMATION.TITLE_SHAKE_DURATION);
        });
    }

    // Show controls and stats after NOODEL animation completes
    showControlsAndStats() {
        // Show controls after a short delay
        setTimeout(() => {
            this.dom.controls.classList.add('visible');
        }, CONFIG.ANIMATION.CONTROLS_DELAY);
        
        // Show stats shortly after controls
        setTimeout(() => {
            this.dom.stats.classList.add('visible');
        }, CONFIG.ANIMATION.STATS_DELAY);
    }

    // Drop letter in column with three-stage animation
    dropLetterInColumn(column, letter, targetRow, onComplete) {
        // Get the next-up letter block position
        const nextUpBlock = this.dom.getNextUpBlock();
        const nextUpRect = nextUpBlock.getBoundingClientRect();
        
        // Calculate target position
        const targetIndex = targetRow * CONFIG.GRID.COLUMNS + column;
        const targetSquare = this.dom.getGridSquare(targetIndex);
        const targetRect = targetSquare.getBoundingClientRect();
        
        // Get top row position in the column
        const topRowIndex = column;
        const topRowSquare = this.dom.getGridSquare(topRowIndex);
        const topRowRect = topRowSquare.getBoundingClientRect();
        
        // Create overlay element
        const overlay = document.createElement('div');
        overlay.className = 'dropping-letter-overlay';
        overlay.textContent = letter;
        
        // Set initial position to match next-up block
        overlay.style.left = `${nextUpRect.left}px`;
        overlay.style.top = `${nextUpRect.top}px`;
        overlay.style.width = `${nextUpRect.width}px`;
        overlay.style.height = `${nextUpRect.height}px`;
        
        document.body.appendChild(overlay);
        
        // Force reflow
        overlay.offsetHeight;
        
        // Stage 1: Move to top of column (0.3s)
        overlay.style.left = `${topRowRect.left}px`;
        overlay.style.top = `${topRowRect.top}px`;
        overlay.style.width = `${topRowRect.width}px`;
        overlay.style.height = `${topRowRect.height}px`;
        
        // Stage 2: Drop to target position
        setTimeout(() => {
            overlay.classList.add('animating');
            overlay.style.top = `${targetRect.top}px`;
        }, CONFIG.ANIMATION.LETTER_DROP_START);
        
        // Stage 3: Settlement
        setTimeout(() => {
            targetSquare.textContent = letter;
            targetSquare.classList.add('filled');
            document.body.removeChild(overlay);
            
            // Call completion callback
            if (onComplete) {
                onComplete();
            }
        }, CONFIG.ANIMATION.LETTER_STAGE_2_DELAY);
    }

    // Highlight and shake word cells when a word is found
    highlightAndShakeWord(positions) {
        return new Promise((resolve) => {
            // Add word-found class to all cells in the word
            positions.forEach(pos => {
                const square = this.dom.getGridSquare(pos.index);
                if (square) {
                    square.classList.add('word-found');
                }
            });
            
            // Resolve after animation completes
            setTimeout(resolve, CONFIG.ANIMATION.WORD_ANIMATION_DURATION);
        });
    }

    // Clear word cells after animation
    clearWordCells(positions) {
        positions.forEach(pos => {
            const square = this.dom.getGridSquare(pos.index);
            if (square) {
                square.textContent = '';
                square.classList.remove('filled', 'word-found');
            }
        });
    }
}
