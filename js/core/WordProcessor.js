import { WordItem } from '../word/WordItem.js';
import { calculateWordScore } from '../scoring/ScoringUtils.js';
import { FEATURES } from './features.js';

/**
 * Tutorial UI state constants
 */
const TutorialUIState = { 
    INACTIVE: 'inactive',
    ACTIVE: 'active',
    COMPLETED: 'completed'
};

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
        
        // Queue for serializing word expiration handling (prevents concurrent grid mutations)
        this.wordExpirationQueue = Promise.resolve();
        
        // Batch processing for grace period expiration
        // Collects multiple expiring words within a short window for synchronized animation/physics
        this.pendingBatch = new Map();  // Map<wordKey, wordData>
        this.batchTimer = null;         // Timeout handle for batch processing
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
                const wordKey = this.gracePeriodManager.generateWordKey(wordData);
                
                // If this exact word is already pending, skip it entirely
                // (don't reset timer just because the same word was re-detected)
                if (this.gracePeriodManager.pendingWords.has(wordKey)) {
                    continue;
                }
                
                // Check for intersections with existing pending words
                const intersectingWords = this.gracePeriodManager.getIntersectingWordsWithDirection(wordData.positions);
                
                if (intersectingWords.length > 0) {
                    // Separate intersections by direction
                    const sameDirectionKeys = intersectingWords
                        .filter(w => w.direction === wordData.direction)
                        .map(w => w.wordKey);
                    const differentDirectionKeys = intersectingWords
                        .filter(w => w.direction !== wordData.direction)
                        .map(w => w.wordKey);
                    
                    // Check if this word is an extension of any same-direction pending word
                    let isExtending = false;
                    for (const existingKey of sameDirectionKeys) {
                        if (this.gracePeriodManager.isExtension(wordData.positions, existingKey)) {
                            isExtending = true;
                            // This is a longer word that extends an existing pending word
                            // Remove the shorter word and add the longer one with fresh timer
                            this.gracePeriodManager.handleWordExtension(wordData, sameDirectionKeys);
                            break;
                        }
                    }
                    
                    // Same direction but not extending - ignore this word
                    if (sameDirectionKeys.length > 0 && !isExtending) {
                        continue;
                    }
                    
                    // Different direction (crossing) - add as new word and reset intersecting words
                    if (differentDirectionKeys.length > 0) {
                        this.gracePeriodManager.addPendingWord(wordData);
                        differentDirectionKeys.forEach(key => this.gracePeriodManager.resetGracePeriod(key));
                        // Continue to add word to display below
                    } else if (!isExtending) {
                        // No intersections handled yet, shouldn't reach here but safety fallback
                        continue;
                    }
                } else {
                    // No intersections - add as new pending word
                    this.gracePeriodManager.addPendingWord(wordData);
                }
                
                // If word is "START" and tutorial is active, mark tutorial as completed
                if (wordData.word === 'START' && this.game.tutorialUIState === TutorialUIState.ACTIVE) {
                    console.log('START word found - completing tutorial');
                    this.game.tutorialUIState = TutorialUIState.COMPLETED;
                    this.game.updateTutorialUI();
                }
            }
        } finally {
            this.isProcessingWords = false;
            // If another call came in while we were processing, re-check with fresh grid state
            if (this.wordCheckPending) {
                this.wordCheckPending = false;
                await this.checkAndProcessWords(addScore, useGracePeriod);
            }
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
            const wordClearDelay = parseFloat(root.getPropertyValue('--animation-delay-word-clear').trim());
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
     * Handle word expiration after grace period
     * Called when a pending word's timer expires
     * Serialized through wordExpirationQueue to prevent concurrent grid mutations
     * @param {Object} wordData - Word to expire
     * @param {string} wordKey - Word key for grace period manager
     * @param {Function} origCallback - Original callback from grace period manager
     */
    async handleWordExpired(wordData, wordKey, origCallback) {
        if (typeof origCallback === 'function') {
            origCallback(wordData, wordKey);
        }
        // Chain this expiration to the queue to serialize grid mutations
        this.wordExpirationQueue = this.wordExpirationQueue.then(async () => {
            // Staleness guard: skip if word was already cleared (reset may have happened)
            if (this.gracePeriodManager.pendingWords.has(wordKey)) {
            
            console.log(`Word grace period expired: ${wordData.word}`);
            
            // Pause word detection during clearing to prevent new words from being
            // detected using cells that are mid-animation/about to be removed
            this.wordDetectionEnabled = false;
            
            // Add word to display now that it's confirmed final
            const points = calculateWordScore(wordData.word);
            const wordItem = new WordItem(wordData.word, wordData.definition, points);
            const willAddToScore = this.game.state.scoringEnabled;
            this.game.score.addWord(wordItem, willAddToScore);
            
            // First, clear the pending animation (remove word-pending class)
            this.game.animator.updateWordPendingAnimation(wordData.positions, 'clear');
            
            // Animate word shake
            const shouldAnimate = FEATURES.ANIMATION_WORD_HIGHLIGHT;
            if (shouldAnimate) {
                await this.game.animator.highlightAndShakeWord(wordData.positions);
            }
            
            // Clear word cells from grid
            this.game.animator.clearWordCells(wordData.positions);
            
            // Remove from pending (this will also try to clear animation but it's already cleared)
            this.gracePeriodManager.removePendingWord(wordKey);
            
            // Wait a bit before applying gravity (if animation was shown)
            if (shouldAnimate) {
                const root = getComputedStyle(document.documentElement);
                const wordClearDelay = parseFloat(root.getPropertyValue('--animation-delay-word-clear').trim());
                await new Promise(resolve => 
                    setTimeout(resolve, wordClearDelay)
                );
            }
            
            // Apply gravity to drop letters down (creates new game state) - if enabled
            if (FEATURES.GRAVITY_PHYSICS) {
                this.game.grid.applyGravity();
            } else {
                // Even without gravity, update column fill counts based on actual grid state
                this.game.grid.updateColumnFillCounts();
            }
            
            // Short delay before checking for new words (cascade effect after gravity)
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Re-enable word detection now that cells are settled
            this.wordDetectionEnabled = true;
            
            // Recursively check for new words from cascading (gravity creates new words)
            await this.checkAndProcessWords(true);  // addScore=true for cascaded words
            }
        });
        
        return this.wordExpirationQueue;
    }
}
