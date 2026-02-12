import { WordItem } from '../word/WordItem.js';
import { calculateWordScore } from '../scoring/ScoringUtils.js';
import { FEATURES } from './features.js';
import { TutorialUIState } from './gameConstants.js';

/**
 * WordProcessor - Manages word detection, validation, and clearing
 * 
 * Responsibilities:
 * - Detect words on the grid using WordResolver
 * - Process words with grace period system (delay clearing to confirm stability)
 * - Handle word expiration (when grace period times out)
 * - Apply gravity and cascade logic after words are cleared
 * - Track progress for Clear Mode
 * 
 * The grace period system allows words to be shown as "pending" for 1 second
 * before being confirmed and cleared, giving players feedback about detected words.
 */
export class WordProcessor {
    /**
     * Initialize WordProcessor
     * @param {Game} game - Game instance
     * @param {WordGracePeriodManager} gracePeriodManager - Grace period manager
     */
    constructor(game, gracePeriodManager) {
        this.game = game;
        this.gracePeriodManager = gracePeriodManager;
        
        // Word detection flags
        this.isProcessingWords = false;
        this.wordCheckPending = false;
        this.wordDetectionEnabled = true;
        
        // Batch processing for grace period expiration
        // Collects multiple expiring words within a short window for synchronized animation/physics
        this.pendingBatch = new Map();  // Map<wordKey, wordData>
        this.batchTimer = null;         // Timeout handle for batch processing

        // Link the manager to this processor
        this.gracePeriodManager.setOnWordExpired(
            (data, key, cb) => this.handleWordExpired(data, key, cb)
        );
    }

    /**
     * Pause word detection globally (e.g., during sequences)
     */
    pause() {
        this.wordDetectionEnabled = false;
        console.log('Word detection paused');
    }

    /**
     * Resume word detection globally
     */
    resume() {
        this.wordDetectionEnabled = true;
        console.log('Word detection resumed');
    }

    /**
     * Cleanup method to clear batch processing state
     * Should be called during game reset to prevent stale batches from processing
     */
    cleanup() {
        // Clear pending batch
        this.pendingBatch.clear();
        
        // Cancel any pending batch timer
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        
        console.log('WordProcessor cleanup completed');
    }

    /**
     * Check grid for words and process them with optional grace period
     * @param {boolean} addScore - Whether to add score for detected words
     * @param {boolean} useGracePeriod - Whether to use grace period delay
     */
    async checkAndProcessWords(addScore = true, useGracePeriod = true) {
        // Skip if word detection is paused (e.g., during sequences)
        if (!this.wordDetectionEnabled) {
            return;
        }
        
        // Re-entrancy guard: if already processing, flag for re-check after completion
        if (this.isProcessingWords) {
            this.wordCheckPending = true;
            return;
        }
        
        this.isProcessingWords = true;
        try {
            // Find all words on current grid state
            const foundWords = this.game.wordResolver.checkForWords();
            
            if (foundWords.length === 0) {
                return;  // No words found
            }
            
            // If not using grace period, process words immediately (old behavior)
            if (!useGracePeriod) {
                await this.processWordsImmediately(foundWords, addScore);
                return;
            }
        
            // Process each found word through grace period system
            for (const wordData of foundWords) {
                this._handleSingleWordGracePeriod(wordData);
                this._checkTutorialProgression(wordData);
            }
        } finally {
            this.isProcessingWords = false;
            // If another call came in while we were processing, re-check with fresh grid state
            if (this.wordCheckPending) {
                this.wordCheckPending = false;
                // Await the re-check so callers observe a fully settled word-processing cycle
                await this.checkAndProcessWords(addScore, useGracePeriod);
            }
        }
    }

    /**
     * Handles the logic for a single word entering the grace period system
     * @param {Object} wordData - Word to process
     * @private
     */
    _handleSingleWordGracePeriod(wordData) {
        const manager = this.gracePeriodManager;
        const wordKey = manager.generateWordKey(wordData);

        // If this exact word is already pending, skip it entirely
        if (manager.pendingWords.has(wordKey)) {
            return;
        }

        // Check for intersections with existing pending words
        const intersections = manager.getIntersectingWordsWithDirection(wordData.positions);
        
        if (intersections.length === 0) {
            // No intersections - add as new pending word
            manager.addPendingWord(wordData);
            return;
        }

        // Separate intersections by direction
        const sameDir = intersections.filter(w => w.direction === wordData.direction);

        // Handle extensions (e.g., "PLAY" becomes "PLAYER")
        const extensionMatch = sameDir.find(w => manager.isExtension(wordData.positions, w.wordKey));
        
        if (extensionMatch) {
            // This is a longer word that extends an existing pending word
            // Remove the shorter word and add the longer one with fresh timer
            manager.handleWordExtension(wordData, sameDir.map(w => w.wordKey));
        } else {
            // For any non-extension intersections (same or different direction),
            // we should still add the new word to pending and reset the grace
            // period for any intersecting pending words so timers don't unexpectedly
            // allow the old word to expire first and cause accidental double-processing.
            manager.addPendingWord(wordData);
            intersections.forEach(w => manager.resetGracePeriod(w.wordKey));
        }
    }

    /**
     * Check if tutorial state needs to be updated based on found word
     * @param {Object} wordData - Word to check
     * @private
     */
    _checkTutorialProgression(wordData) {
        if (wordData.word === 'START' && this.game.tutorialUIState === TutorialUIState.ACTIVE) {
            console.log('START word found - completing tutorial');
            this.game.tutorialUIState = TutorialUIState.COMPLETED;
            this.game.updateTutorialUI();
        }
    }

    /**
     * Process words immediately without grace period (used during START sequence)
     * This is the old behavior before grace period was added
     * @param {Array} foundWords - Words to process
     * @param {boolean} addScore - Whether to add score
     */
    async processWordsImmediately(foundWords, addScore) {
        // Check if word highlighting animation is enabled
        const shouldAnimate = FEATURES.ANIMATION_WORD_HIGHLIGHT;
        
        if (shouldAnimate) {
            const animationPromises = foundWords.map(wordData => 
                this.game.animator.highlightAndShakeWord(wordData.positions)
            );
            await Promise.all(animationPromises);
        }
        
        // Add all words to made words list (if addScore is true)
        foundWords.forEach(wordData => {
            const points = calculateWordScore(wordData.word);
            const wordItem = new WordItem(wordData.word, wordData.definition, points);

            const willDisplay = addScore;
            const willAddToScore = addScore && this.game.state.scoringEnabled;

            if (willDisplay) {
                this.game.score.addWord(wordItem, willAddToScore);
            }
        });
        
        // Clear all word cells after animation
        foundWords.forEach(wordData => {
            this.game.animator.clearWordCells(wordData.positions);
        });
        
        // Wait a bit before applying gravity (if animation was shown)
        if (shouldAnimate) {
            const root = getComputedStyle(document.documentElement);
            const wordClearDelay = parseFloat(root.getPropertyValue('--animation-delay-word-clear')) || 400;
            await new Promise(resolve => setTimeout(resolve, wordClearDelay));
        }
        
        // Apply gravity to drop letters down - if enabled
        if (FEATURES.GRAVITY_PHYSICS) {
            this.game.grid.applyGravity();
        } else {
            // Even without gravity, update column fill counts based on actual grid state
            this.game.grid.updateColumnFillCounts();
        }
                
        // Short delay before checking for new words
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check for cascading words (also immediately)
        const cascadeWords = this.game.wordResolver.checkForWords();
        if (cascadeWords.length > 0) {
            await this.processWordsImmediately(cascadeWords, addScore);
        }
    }

    /**
     * Finalize word data: add to score and remove pending CSS class
     * @param {Object} wordData - Word to finalize
     */
    finalizeWordData(wordData) {
        // Add word to display now that it's confirmed final
        const points = calculateWordScore(wordData.word);
        const wordItem = new WordItem(wordData.word, wordData.definition, points);
        const willAddToScore = this.game.state.scoringEnabled;
        this.game.score.addWord(wordItem, willAddToScore);
        
        // Clear the pending animation (remove word-pending class)
        this.game.animator.updateWordPendingAnimation(wordData.positions, 'clear');
    }

    /**
     * Animate removal of multiple words in parallel
     * @param {Array} allPositions - Array of position arrays [positions1, positions2, ...]
     */
    async animateBatchRemoval(allPositions) {
        const shouldAnimate = FEATURES.ANIMATION_WORD_HIGHLIGHT;
        
        if (shouldAnimate && allPositions.length > 0) {
            // Animate all words in parallel using Promise.all
            const animationPromises = allPositions.map(positions =>
                this.game.animator.highlightAndShakeWord(positions)
            );
            await Promise.all(animationPromises);
            
            // Clear word cells from grid
            allPositions.forEach(positions => {
                this.game.animator.clearWordCells(positions);
            });
            
            // Wait for animation to complete
            const root = getComputedStyle(document.documentElement);
            const wordClearDelay = parseFloat(root.getPropertyValue('--animation-delay-word-clear')) || 400;
            await new Promise(resolve => setTimeout(resolve, wordClearDelay));
        } else {
            // No animation - just clear cells immediately
            allPositions.forEach(positions => {
                this.game.animator.clearWordCells(positions);
            });
        }
    }

    /**
     * Run grid physics once for the batch
     * Applies gravity and updates column fill counts
     */
    runGridPhysics() {
        if (FEATURES.GRAVITY_PHYSICS) {
            this.game.grid.applyGravity();
        } else {
            // Even without gravity, update column fill counts based on actual grid state
            this.game.grid.updateColumnFillCounts();
        }
    }

    /**
     * Process all words that expired in the current batch (Batch Processor)
     * Orchestrates: finalization, parallel animation, physics, and cascade checking
     */
    async processExpiredBatch() {
        if (this.pendingBatch.size === 0) return;

        // Collect all words from the batch
        const batchToProcess = new Map(this.pendingBatch);
        this.pendingBatch.clear();
        this.batchTimer = null;

        // Phase 1: Lock detection but queue up any attempts to check words
        // This ensures words formed during clearing are eventually processed
        this.isProcessingWords = true;

        try {
            const validEntries = Array.from(batchToProcess.entries());

            // Phase 2: Finalize & Score synchronously
            validEntries.forEach(([key, data]) => {
                console.log(`Word grace period expired: ${data.word}`);
                this.finalizeWordData(data);
                // Remove from manager so it doesn't get re-detected
                this.gracePeriodManager.removePendingWord(key);
            });

            // Phase 3: Animate all word removals in parallel
            const allPositions = validEntries.map(entry => entry[1].positions);
            await this.animateBatchRemoval(allPositions);

            // Phase 4: Apply physics once per batch
            this.runGridPhysics();

            // Phase 5: Wait for settling before re-enabling detection
            await new Promise(resolve => setTimeout(resolve, 300));

        } finally {
            this.isProcessingWords = false;
            // Phase 6: Check if user actions or cascades created new words
            try {
                await this.checkAndProcessWords(true);
            } catch (err) {
                console.error('Error while checking and processing cascade words:', err);
            }
        }
    }

    /**
     * Handle word expiration after grace period (Collector Pattern)
     * Collects expiring words into a batch for synchronized processing
     * @param {Object} wordData - Word to expire
     * @param {string} wordKey - Word key for grace period manager
     * @param {Function} origCallback - Original callback from grace period manager
     */
    async handleWordExpired(wordData, wordKey, origCallback) {
        if (typeof origCallback === 'function') {
            origCallback(wordData, wordKey);
        }
        // Add word to the current batch
        this.pendingBatch.set(wordKey, wordData);

        // Start a timer to process all gathered words at once
        if (!this.batchTimer) {
            // Using a slightly longer window (100ms) helps catch words 
            // that were formed in the same "move"
            this.batchTimer = setTimeout(() => this.processExpiredBatch(), 100);
        }
    }
}
