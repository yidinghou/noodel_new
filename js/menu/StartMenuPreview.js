import { CONFIG } from '../config.js';
import { AnimationHelpers } from '../animation/AnimationHelpers.js';
import { calculateIndex } from '../grid/gridUtils.js';

/**
 * StartMenuPreview class - Displays START in the letter preview area
 * Alternative to grid-based menu system
 * Shows "START" where S is the next-up letter (index 0)
 */
export class StartMenuPreview {
    constructor(domCache, onStart) {
        this.dom = domCache;
        this.onStart = onStart;
        this.isActive = false;
        // this.clickHandlers = []; // Removed: click handler storage
        
        // Use CONFIG for letters
        this.startLetters = CONFIG.PREVIEW_START.LETTERS;
        
        // Load timing from CSS (following AnimationController pattern)
        this.timings = this.loadStartMenuTimings();
    }

    /**
     * Load START menu animation timings from CSS
     * Follows AnimationHelpers pattern
     */
    loadStartMenuTimings() {
        const root = getComputedStyle(document.documentElement);
        const parseTime = AnimationHelpers.parseTime;
        
        return {
            clickHighlight: parseTime(root.getPropertyValue('--animation-duration-start-click-highlight')),
            letterDrop: parseTime(root.getPropertyValue('--animation-delay-start-letter-drop')),
            wordPause: parseTime(root.getPropertyValue('--animation-delay-start-word-pause')),
            clearPause: parseTime(root.getPropertyValue('--animation-delay-start-clear-pause'))
        };
    }

    /**
     * Show START in the preview area
     */
    show() {
        this.isActive = true;
        this.droppedLetters = 0;
        
        // Get all preview blocks
        const previewBlocks = this.dom.preview.querySelectorAll('.preview-letter-block');
        
        if (previewBlocks.length !== CONFIG.GAME.PREVIEW_COUNT) {
            console.error(`Expected ${CONFIG.GAME.PREVIEW_COUNT} preview blocks, found ${previewBlocks.length}`);
            return;
        }
        
        // Display START with S at index 0 (next-up position)
        this.startLetters.forEach((letter, index) => {
            const block = previewBlocks[index];
            block.textContent = letter;
            
            // Add next-up styling to S (first letter) - it will get orange color automatically
            if (index === 0) {
                block.classList.add('next-up');
            }
            
            // Only store letter index for styling/logic, no click handler
            block.dataset.letterIndex = index;
        });
        
        // Make preview visible
        this.dom.preview.classList.add('visible');
        
        // Removed: addClickHandlers (no click logic)
    }





    /**
     * Hide the START menu
     */
    hide() {
        this.isActive = false;
        
        // Remove click handlers
        this.clickHandlers.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
        });
        this.clickHandlers = [];
        
        const previewBlocks = this.dom.preview.querySelectorAll('.preview-letter-block');
        
        previewBlocks.forEach(block => {
            block.textContent = '';
            block.classList.remove('next-up');
            delete block.dataset.startMenuLetter;
            delete block.dataset.letterIndex;
        });
    }

    /**
     * Check if menu is currently active
     */
    isMenuActive() {
        return this.isActive;
    }
}
