import { CONFIG } from '../config.js';

/**
 * WordGracePeriodManager - Manages pending words with grace period timers
 * 
 * Features:
 * - Each found word gets a 1-second grace period before clearing
 * - Extending a word (longer word contains pending word positions) resets timer
 * - All intersecting words reset together if one is extended
 * - Visual feedback via CSS animation during grace period
 * - Coordinates with AnimationController for visual updates
 */
export class WordGracePeriodManager {
    constructor(animator, config = {}) {
        this.animator = animator;
        this.gracePeriodMs = config.gracePeriodMs || 1000;  // Default 1 second
        
        // Map<wordKey, {wordData, timerId, startTime, positionSet}>
        // wordKey = "word_direction_startRow_startCol"
        this.pendingWords = new Map();
        
        // Set to track all currently pending positions (for intersection detection)
        this.allPendingPositions = new Set();
        
        // Callbacks for when word processing completes
        this.onWordExpired = null;  // Called with (wordData, wordKey) when timer expires
    }

    /**
     * Generate a unique key for a word based on its position and direction
     */
    generateWordKey(wordData) {
        const firstPos = wordData.positions[0];
        return `${wordData.word}_${wordData.direction}_${firstPos.row}_${firstPos.col}`;
    }

    /**
     * Create a Set of position strings from word positions
     */
    positionsToSet(positions) {
        return new Set(positions.map(pos => `${pos.row},${pos.col}`));
    }

    /**
     * Add a word to the pending queue with grace period timer
     * @param {Object} wordData - Word data {word, positions, direction, definition}
     * @param {Function} onExpired - Optional callback when timer expires
     */
    addPendingWord(wordData, onExpired = null) {
        const wordKey = this.generateWordKey(wordData);
        
        // If word already pending, reset its timer instead
        if (this.pendingWords.has(wordKey)) {
            this.resetGracePeriod(wordKey, onExpired);
            return;
        }
        
        const positionSet = this.positionsToSet(wordData.positions);
        
        // Create timer
        const timerId = setTimeout(() => {
            console.log(`Grace period timer fired for word: ${wordData.word}`);
            if (this.onWordExpired) {
                this.onWordExpired(wordData, wordKey, onExpired);
            } else {
                console.error('onWordExpired callback not set!');
            }
        }, this.gracePeriodMs);
        
        console.log(`Added pending word: ${wordData.word} with ${this.gracePeriodMs}ms grace period`);
        
        // Add to pending words
        this.pendingWords.set(wordKey, {
            wordData,
            timerId,
            startTime: Date.now(),
            positionSet,
            onExpired  // Store callback for later use
        });
        
        // Track positions for intersection detection
        positionSet.forEach(pos => this.allPendingPositions.add(pos));
        
        // Start visual animation
        this.animator.startWordPendingAnimation(wordData.positions);
    }

    /**
     * Reset grace period for a word (restart the 1-second timer)
     * @param {string} wordKey - Key of the word to reset
     * @param {Function} onExpired - Optional new callback
     */
    resetGracePeriod(wordKey, onExpired = null) {
        const pending = this.pendingWords.get(wordKey);
        if (!pending) return;
        
        // Clear existing timer
        clearTimeout(pending.timerId);
        
        // Create new timer
        const timerId = setTimeout(() => {
            this.onWordExpired(pending.wordData, wordKey, pending.onExpired);
        }, this.gracePeriodMs);
        
        // Update entry
        pending.timerId = timerId;
        pending.startTime = Date.now();
        if (onExpired) {
            pending.onExpired = onExpired;
        }
        
        // Reset visual animation (restart the green fill)
        this.animator.resetWordPendingAnimation(pending.wordData.positions);
    }

    /**
     * Get all intersecting word keys (words that share any cell with given positions)
     * @param {Array} positions - Positions to check {row, col, index}
     * @returns {Array<string>} Array of word keys that intersect
     */
    getIntersectingWordKeys(positions) {
        const posSet = this.positionsToSet(positions);
        const intersecting = [];
        
        for (const [wordKey, pending] of this.pendingWords) {
            // Check if any position overlaps
            for (const pos of posSet) {
                if (pending.positionSet.has(pos)) {
                    intersecting.push(wordKey);
                    break;
                }
            }
        }
        
        return intersecting;
    }

    /**
     * Get all intersecting words with their direction info
     * @param {Array} positions - Positions to check {row, col, index}
     * @returns {Array<{wordKey: string, direction: string}>} Array of intersecting word info
     */
    getIntersectingWordsWithDirection(positions) {
        const posSet = this.positionsToSet(positions);
        const intersecting = [];
        
        for (const [wordKey, pending] of this.pendingWords) {
            // Check if any position overlaps
            for (const pos of posSet) {
                if (pending.positionSet.has(pos)) {
                    intersecting.push({
                        wordKey,
                        direction: pending.wordData.direction
                    });
                    break;
                }
            }
        }
        
        return intersecting;
    }

    /**
     * Reset grace periods for all words intersecting given positions
     * @param {Array} positions - Positions that triggered the reset
     */
    resetIntersectingWords(positions) {
        const intersectingKeys = this.getIntersectingWordKeys(positions);
        intersectingKeys.forEach(wordKey => this.resetGracePeriod(wordKey));
    }

    /**
     * Remove a word from pending (called when word is processed)
     * @param {string} wordKey - Key of word to remove
     */
    removePendingWord(wordKey) {
        const pending = this.pendingWords.get(wordKey);
        if (!pending) return;
        
        // Clear timer
        clearTimeout(pending.timerId);
        
        // Remove position tracking
        pending.positionSet.forEach(pos => this.allPendingPositions.delete(pos));
        
        // Remove visual animation
        this.animator.clearWordPendingAnimation(pending.wordData.positions);
        
        // Remove from pending
        this.pendingWords.delete(wordKey);
    }

    /**
     * Check if a new word is an extension of a pending word
     * Extension = new word contains all positions of pending word + more
     * @param {Array} newPositions - Positions of new/extending word
     * @param {string} wordKey - Key of pending word to check
     * @returns {boolean}
     */
    isExtension(newPositions, wordKey) {
        const pending = this.pendingWords.get(wordKey);
        if (!pending) return false;
        
        const newPosSet = this.positionsToSet(newPositions);
        
        // Check if all old positions are in new positions
        for (const pos of pending.positionSet) {
            if (!newPosSet.has(pos)) {
                return false;
            }
        }
        
        // Must have at least one new position to be an extension
        return newPosSet.size > pending.positionSet.size;
    }

    /**
     * Handle word extension
     * If a new found word extends a pending word, replace pending with new word
     * @param {Object} newWordData - The extending word
     * @param {Array<string>} intersectingKeys - Keys of intersecting pending words
     */
    handleWordExtension(newWordData, intersectingKeys) {
        // Find which pending words this extends
        const replacedKeys = [];
        
        for (const wordKey of intersectingKeys) {
            if (this.isExtension(newWordData.positions, wordKey)) {
                replacedKeys.push(wordKey);
            }
        }
        
        // Remove replaced pending words
        replacedKeys.forEach(key => this.removePendingWord(key));
        
        // Add the new extending word with fresh timer
        const oldCallback = replacedKeys.length > 0 
            ? this.pendingWords.get(replacedKeys[0])?.onExpired 
            : null;
        this.addPendingWord(newWordData, oldCallback);
    }

    /**
     * Clear all pending words and timers (e.g., on reset)
     */
    clearAll() {
        for (const [wordKey, pending] of this.pendingWords) {
            clearTimeout(pending.timerId);
            this.animator.clearWordPendingAnimation(pending.wordData.positions);
        }
        
        this.pendingWords.clear();
        this.allPendingPositions.clear();
    }

    /**
     * Get all pending words (useful for debugging/display)
     * @returns {Array} Array of {wordKey, wordData, timeRemaining}
     */
    getAllPendingWords() {
        const result = [];
        const now = Date.now();
        
        for (const [wordKey, pending] of this.pendingWords) {
            const timeRemaining = Math.max(
                0,
                this.gracePeriodMs - (now - pending.startTime)
            );
            
            result.push({
                wordKey,
                wordData: pending.wordData,
                timeRemaining
            });
        }
        
        return result;
    }

    /**
     * Set the callback for when words expire
     * This should be set by Game.js to handle the actual word clearing
     * @param {Function} callback - Function(wordData, wordKey, origCallback)
     */
    setOnWordExpired(callback) {
        this.onWordExpired = callback;
    }
}
