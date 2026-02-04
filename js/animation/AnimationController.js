import { CONFIG } from '../config.js';
import { AnimationHelpers } from './AnimationHelpers.js';

/**
 * AnimationController class - Handles all game animations
 * Uses CSS custom properties for timing and animationend events for synchronization
 */
export class AnimationController {
    constructor(domCache, featureManager = null) {
        this.dom = domCache;
        this.features = featureManager;
        this.cssVars = AnimationHelpers.loadCSSTimings();
        
        // Load additional timing for START menu
        const root = getComputedStyle(document.documentElement);
        this.cssVars.startClickHighlight = AnimationHelpers.parseTime(
            root.getPropertyValue('--animation-duration-start-click-highlight')
        );
    }

    // Randomize NOODEL title letter animation delays
    async randomizeTitleLetterAnimations() {
        return new Promise(async (resolve) => {
            const letterBlocks = this.dom.getTitleLetterBlocks();
            const intervalMs = this.cssVars.titleDropInterval;
            
            // Create array of indices and shuffle it
            const indices = Array.from({ length: letterBlocks.length }, (_, i) => i);
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            
            // Track which letter has the longest delay (will finish last)
            let maxDelayIndex = -1;
            let maxDelay = -1;
            
            // Assign delays based on shuffled order
            indices.forEach((originalIndex, dropOrder) => {
                const delayMs = dropOrder * intervalMs;
                letterBlocks[originalIndex].style.animationDelay = `${delayMs}ms`;
                
                if (delayMs > maxDelay) {
                    maxDelay = delayMs;
                    maxDelayIndex = originalIndex;
                }
            });
            
            // Wait for the last letter's animation to complete
            await AnimationHelpers.waitForAnimation(letterBlocks[maxDelayIndex], 'dropIn');
            resolve();
        });
    }

    // Apply shake to all title letters simultaneously
    async shakeAllTitleLetters() {
        const letterBlocks = this.dom.getTitleLetterBlocks();
        
        // Trigger shake on all letters (color is handled by progress bar gradient)
        letterBlocks.forEach(block => {
            // Reset animation delay so all shake together
            block.style.animationDelay = '0s';
            
            // Restart the shaking animation
            AnimationHelpers.restart(block, 'shaking');
        });
        
        // Wait for first letter's shake to complete (they all finish together)
        await AnimationHelpers.waitForAnimation(letterBlocks[0], 'shake');
    }

    // Show controls and stats after NOODEL animation completes
    showControlsAndStats() {
        // Show controls after a short delay
        setTimeout(() => {
            this.dom.controls.classList.add('visible');
        }, this.cssVars.controlsDelay);
        
        // Show stats shortly after controls
        setTimeout(() => {
            this.dom.stats.classList.add('visible');
        }, this.cssVars.statsDelay);
    }

    // Show only stats (when using menu instead of controls)
    showStats() {
        setTimeout(() => {
            this.dom.stats.classList.add('visible');
        }, this.cssVars.statsDelay);
    }

    // Show NOODEL word overlay above stats (without dropping yet)
    showNoodelWordOverlay(wordItem) {
        // Get positions
        const statsRect = this.dom.stats.getBoundingClientRect();
        const madeWordsRect = this.dom.wordsList.getBoundingClientRect();
        
        // Create word item overlay with custom format for intro
        const overlay = document.createElement('div');
        overlay.className = 'word-item word-item-dropping';
        overlay.id = 'noodel-word-overlay'; // ID to reference later
        overlay.innerHTML = `<strong>${wordItem.text} - </strong><small>${wordItem.definition}</small>`;
        
        // Position above stats div - match the full container width
        overlay.style.position = 'fixed';
        overlay.style.left = `${madeWordsRect.left}px`;
        overlay.style.top = `${statsRect.top}px`;
        overlay.style.width = `${madeWordsRect.width}px`;
        overlay.style.zIndex = '100';
        overlay.style.opacity = '0';
        overlay.style.boxSizing = 'border-box';
        
        document.body.appendChild(overlay);
        
        // Force reflow
        overlay.offsetHeight;
        
        // Fade in using CSS timing
        setTimeout(() => {
            overlay.style.transition = `opacity ${this.cssVars.wordOverlayFade}ms ease-out`;
            overlay.style.opacity = '1';
        }, 10);
        
        return overlay;
    }

    // Drop the NOODEL word overlay to made words section (called on START click)
    async dropNoodelWordOverlay(onComplete) {
        const overlay = document.getElementById('noodel-word-overlay');
        if (!overlay) {
            console.error('NOODEL word overlay not found');
            return;
        }
        
        const madeWordsRect = this.dom.wordsList.getBoundingClientRect();
        
        // Start drop animation using CSS timing
        overlay.style.transition = `top ${this.cssVars.wordOverlayDrop}ms ease-out`;
        overlay.style.top = `${madeWordsRect.top}px`;
        
        // Wait for transition to complete
        await AnimationHelpers.waitForTransition(overlay, 'top');
        
        // Show stats after drop finishes
        this.dom.stats.classList.add('visible');
        
        // Wait a bit more, then remove overlay and add to list
        await new Promise(resolve => setTimeout(resolve, this.cssVars.wordOverlayFade));
        
        document.body.removeChild(overlay);
        
        // Add to actual made words list
        if (onComplete) {
            onComplete();
        }
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
        
        // Stage 1: Move to top of column
        overlay.style.left = `${topRowRect.left}px`;
        overlay.style.top = `${topRowRect.top}px`;
        overlay.style.width = `${topRowRect.width}px`;
        overlay.style.height = `${topRowRect.height}px`;
        
        // Stage 2: Drop to target position (after stage 1 completes)
        setTimeout(() => {
            overlay.classList.add('animating');
            overlay.style.top = `${targetRect.top}px`;
        }, this.cssVars.letterStage2Delay);
        
        // Stage 3: Settlement (after drop completes)
        setTimeout(() => {
            targetSquare.textContent = letter;
            targetSquare.classList.add('filled');
            document.body.removeChild(overlay);
            
            // Call completion callback
            if (onComplete) {
                onComplete();
            }
        }, this.cssVars.letterStage2Delay + this.cssVars.letterDrop);
    }

    // Highlight and shake word cells when a word is found
    async highlightAndShakeWord(positions) {
        // Add word-found class to all cells in the word
        positions.forEach(pos => {
            const square = this.dom.getGridSquare(pos.index);
            if (square) {
                square.classList.add('word-found');
            }
        });
        
        // Wait for animation on first square (they all finish together)
        const firstSquare = this.dom.getGridSquare(positions[0].index);
        if (firstSquare) {
            await AnimationHelpers.waitForAnimation(firstSquare, 'wordShake');
        } else {
            // Fallback if square not found
            await new Promise(resolve => setTimeout(resolve, this.cssVars.wordFoundDuration));
        }
    }

    // Clear word cells after animation
    clearWordCells(positions) {
        positions.forEach(pos => {
            const square = this.dom.getGridSquare(pos.index);
            if (square) {
                square.textContent = '';
                square.classList.remove('filled', 'word-found', 'resolved');
                
                // Remove fill element if it exists
                const fillElement = square.querySelector('.fill');
                if (fillElement) {
                    fillElement.remove();
                }
            }
        });
    }

    /**
     * Update NOODEL title letter progress bar based on letters remaining
     * Each letter represents a portion of the total progress
     * Supports partial filling of individual letters
     */
    updateLetterProgress(lettersRemaining, totalLetters) {
        // Check if progress bar feature is enabled
        if (!this.features || !this.features.isEnabled('titleProgressBar')) {
            return;
        }
        
        const percentRemaining = (lettersRemaining / totalLetters) * 100;
        const letterBlocks = this.dom.getTitleLetterBlocks();
        const lettersCount = letterBlocks.length; // 6 for NOODEL
        const percentPerLetter = 100 / lettersCount; // ~16.67%
        
        letterBlocks.forEach((block, index) => {
            const letterStart = index * percentPerLetter;
            const letterEnd = (index + 1) * percentPerLetter;
            
            let greenPercent = 100; // Default: fully green
            
            if (percentRemaining <= letterStart) {
                // This letter should be fully gray
                greenPercent = 0;
            } else if (percentRemaining < letterEnd) {
                // This letter is partially filled
                const partialProgress = percentRemaining - letterStart;
                greenPercent = (partialProgress / percentPerLetter) * 100;
            }
            
            block.style.setProperty('--progress-percent', `${greenPercent}%`);
        });
    }

    /**
     * Pulsate grid to help user identify playable area
     * Triggers a green glow animation that repeats 3 times
     */
    async pulsateGrid() {
        const grid = this.dom.grid;
        
        // Add pulsating class to trigger animation
        grid.classList.add('pulsating');
        
        // Wait for animation to complete (1.5s duration * 3 iterations)
        await new Promise(resolve => setTimeout(resolve, 4500));
        
        // Remove class after animation finishes
        grid.classList.remove('pulsating');
    }

    /**
     * Simulate a click highlight on a grid square
     * Used for visual feedback during automated animations
     * @param {number} index - Grid square index
     * @param {string} className - CSS class to apply (default: 'column-clicked')
     * @param {number} duration - Duration in ms (optional, uses CSS timing if not provided)
     */
    async highlightGridSquare(index, className = 'column-clicked', duration = null) {
        const square = this.dom.getGridSquare(index);
        if (!square) return;
        
        // Add highlight class
        square.classList.add(className);
        
        // Use provided duration or load from CSS
        const highlightDuration = duration || this.cssVars.startClickHighlight || 150;
        await new Promise(resolve => setTimeout(resolve, highlightDuration));
        
        // Remove highlight class
        square.classList.remove(className);
    }

    /**
     * Shake all preview letter blocks
     * Used for visual feedback on reset
     */
    async shakePreviewLetters() {
        const preview = this.dom.preview;
        if (!preview) return;
        
        const blocks = preview.querySelectorAll('.preview-letter-block');
        if (!blocks.length) return;
        
        // Add shake animation to all blocks
        blocks.forEach(block => {
            block.style.animation = 'previewShake 0.4s ease-in-out';
        });
        
        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Clear animation
        blocks.forEach(block => {
            block.style.animation = '';
        });
    }

    /**
     * Highlight/flash stat elements (score and letters remaining)
     * Used for visual feedback on reset
     */
    async highlightStats() {
        const scoreValue = this.dom.scoreValue;
        const lettersRemaining = this.dom.lettersRemaining;
        
        if (!scoreValue || !lettersRemaining) return;
        
        // Add flash animation
        scoreValue.style.animation = 'highlightFlash 0.6s ease-in-out';
        lettersRemaining.style.animation = 'highlightFlash 0.6s ease-in-out';
        
        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Clear animation
        scoreValue.style.animation = '';
        lettersRemaining.style.animation = '';
    }

    /**
     * Start resolve grace period animation for found words
     * @param {Array} positions - Array of position objects with index property
     * @param {number} duration - Duration in milliseconds (default: 1000)
     * @returns {Object} Controller object with promise, cancel, finalize, and nodes
     */
    startResolveGrace(positions, duration = 1000) {
        const nodes = [];
        let timerId = null;
        let promiseResolve = null;
        let cancelled = false;
        
        // Create promise that resolves after duration
        const promise = new Promise((resolve) => {
            promiseResolve = resolve;
            
            // Setup each grid square with fill element and classes
            positions.forEach(pos => {
                const square = this.dom.getGridSquare(pos.index);
                if (!square) return;
                
                // Ensure .fill element exists
                let fillElement = square.querySelector('.fill');
                if (!fillElement) {
                    fillElement = document.createElement('div');
                    fillElement.className = 'fill';
                    square.appendChild(fillElement);
                }
                
                // Add resolving and word-found classes
                square.classList.add('resolving', 'word-found');
                
                nodes.push(square);
            });
            
            // Start timer to resolve after duration
            timerId = setTimeout(() => {
                if (!cancelled) {
                    resolve();
                }
            }, duration);
        });
        
        // Controller object with cancel and finalize methods
        const controller = {
            promise,
            nodes,
            cancel: () => {
                cancelled = true;
                if (timerId) {
                    clearTimeout(timerId);
                    timerId = null;
                }
                // Remove resolving class and fill element from all nodes
                nodes.forEach(square => {
                    square.classList.remove('resolving', 'word-found');
                    const fillElement = square.querySelector('.fill');
                    if (fillElement) {
                        fillElement.remove();
                    }
                });
                if (promiseResolve) {
                    promiseResolve();
                }
            },
            finalize: () => {
                // Remove resolving and word-found classes, add resolved class
                nodes.forEach(square => {
                    square.classList.remove('resolving', 'word-found');
                    square.classList.add('resolved');
                });
            }
        };
        
        return controller;
    }

    /**
     * Cancel resolve grace period animation
     * @param {Object} controller - Controller object returned from startResolveGrace
     */
    cancelResolveGrace(controller) {
        if (controller && controller.cancel) {
            controller.cancel();
        }
    }

    /**
     * Finalize resolve grace period animation (apply final resolved state)
     * @param {Object} controller - Controller object returned from startResolveGrace
     */
    finalizeResolveGrace(controller) {
        if (controller && controller.finalize) {
            controller.finalize();
        }
    }
}
