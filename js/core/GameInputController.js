import { CONFIG, GameModes } from '../config.js';
import { INPUT_BUFFER_MS } from './gameConstants.js';
import { isValidColumn, calculateIndex } from '../grid/gridUtils.js';
import { GamePhase } from './GameStateMachine.js';
import { FEATURES } from './features.js';

/**
 * GameInputController - Handles all user input and interactions
 * Manages square clicks, letter drops, and inactivity detection
 */
export class GameInputController {
    constructor(game) {
        this.game = game;
        this.lastDropTime = 0;
    }

    /**
     * Handle clicks on grid squares
     * Routes to START sequence or regular gameplay
     */
    handleSquareClick(e) {
        // Handle START sequence clicks (before game is started)
        if (this.game.startSequence.isActive && !this.game.state.started) {
            return this.handleStartSequenceClick(e);
        }
        
        if (!this.game.state.started) return;
        
        // Input buffer: prevent rapid clicks within 250ms
        if (Date.now() - this.lastDropTime < INPUT_BUFFER_MS) {
            return;
        }
        

        
        const column = parseInt(e.target.dataset.column);
        
        // Validate column using gridUtils for consistency
        if (!isValidColumn(column, CONFIG.GRID.COLUMNS)) {
            return;
        }
        
        // Check if column is full
        if (this.game.state.isColumnFull(column)) return;
        
        // Drop the letter
        this.dropLetter(column);
    }

    /**
     * Handle START sequence clicks
     * Validates click position and drops letter if correct
     */
    handleStartSequenceClick(e) {
        // Prevent re-entrance: ignore clicks while animation is in progress
        if (this.game.isStartDropInProgress) {
            console.log('START drop already in progress - ignoring click');
            return;
        }
        
        const column = parseInt(e.target.dataset.column);
        const row = parseInt(e.target.dataset.row);
        
        // Validate click position using controller
        if (!this.game.startSequence.isValidClick(column, row)) {
            const expected = this.game.startSequence.getCurrentExpectedPosition();
            console.log(`Wrong position! Expected column ${expected.column}, row ${expected.row}`);
            return;
        }
        
        // Correct click - proceed with letter drop
        const currentLetter = this.game.startSequence.getCurrentLetter();
        const targetRow = this.game.state.getLowestAvailableRow(column);
        
        // Check if THIS letter we're about to drop is the final one (before advancing)
        const isThisLastLetter = this.game.startSequence.currentIndex === CONFIG.PREVIEW_START.LETTERS.length - 1;
        
        console.log(`Correct! Clicking ${currentLetter} on position (${column}, ${row})`);
        
        // LOCK: Prevent re-entrance until animation completes
        this.game.isStartDropInProgress = true;
        
        // Remove glow from current square
        this.game.startUI.clearStartGuide();
        
        // Drop the letter with animation callback
        this.game.animator.dropLetterInColumn(column, currentLetter, targetRow, async () => {
            try {
                // Update game state after drop completes
                this.game.state.incrementColumnFill(column);
                
                // Advance to next letter
                this.game.startSequence.advance();
                
                // Update preview: remove first letter and shift remaining
                this.game.startUI.updateStartPreviewAfterDrop();
                
                console.log(`Dropped ${currentLetter} in column ${column}`);
                
                // Check if the letter we just placed was the final one
                if (isThisLastLetter) {
                    console.log('Final START letter placed - completing sequence');
                    await this.game.startSequence.complete();
                } else {
                    // Highlight the next square to click
                    this.game.startUI.highlightNextStartGuide();
                }
            } finally {
                // UNLOCK: Allow next click after callback completes
                this.game.isStartDropInProgress = false;
            }
        });
    }

    /**
     * Drop a letter in the given column
     * Handles validation, state updates, and animation
     */
    dropLetter(column) {
        // Defensive validation
        if (!isValidColumn(column, CONFIG.GRID.COLUMNS)) {
            return;
        }
        if (this.game.state.isColumnFull(column)) {
            return;
        }
        
        const nextLetter = this.game.letters.getNextLetter();
        
        // Early guard: validate letter exists before any state mutations
        if (!nextLetter) {
            console.log('No more letters available - game over');
            return;  // Game over - don't mutate state
        }
        
        // Calculate target row FIRST based on current fills + pending (letters already in flight)
        const targetRow = this.game.state.getLowestAvailableRowWithPending(column);
        
        // NOW update game state (after calculating target row)
        // This prevents duplicate placements on rapid clicks
        this.game.state.incrementPendingFill(column);
        this.game.letters.advance();  // Update preview immediately
        this.game.score.updateLettersRemaining();  // Update counter immediately
        this.lastDropTime = Date.now();  // Update buffer timestamp
        
        // Use animation controller with callback
        this.game.animator.dropLetterInColumn(column, nextLetter, targetRow, async () => {
            // Finalize game state after animation completes
            this.game.state.decrementPendingFill(column);
            this.game.state.incrementColumnFill(column);
            
            // Transition to PLAYING phase on first letter drop (if not already playing)
            if (this.game.stateMachine.is(GamePhase.GAME_READY)) {
                this.game.stateMachine.transition(GamePhase.PLAYING);
            }
            
            // Update progress bar in NOODEL title
            this.game.animator.updateLetterProgress(
                this.game.state.lettersRemaining,
                CONFIG.GAME.INITIAL_LETTERS
            );
            
            // Check for words after the letter has been placed (if enabled)
            if (FEATURES.WORD_DETECTION) {
                await this.game.checkAndProcessWords();
            }

            // Check for clear mode victory conditions
            // Clear Mode Victory Rules controlled by CLEAR_MODE_EMPTY_BOARD_WIN flag:
            // - Flag OFF (default): Win when all initial blocks are cleared
            // - Flag ON (stricter): Win ONLY when board is completely empty
            if (this.game.state.gameMode === GameModes.CLEAR && !this.game.wordProcessor.hasPendingWords()) {
                if (FEATURES.CLEAR_MODE_EMPTY_BOARD_WIN) {
                    // STRICTER WIN CONDITION: Board must be completely empty
                    // All tiles (initial + user-generated) must be cleared
                    if (this.game.state.isBoardEmpty(this.game.dom.grid)) {
                        console.log('🎉 CLEAR MODE VICTORY! Board completely cleared!');
                        this.game.lifecycle.endGame('VICTORY');
                        return;
                    }
                } else {
                    // DEFAULT WIN CONDITION: All initial blocks cleared
                    // Victory when all pre-populated tiles are removed from the board
                    if (!this.game.state.hasInitialBlocksRemaining(this.game.dom.grid)) {
                        console.log('🎉 CLEAR MODE VICTORY! All initial blocks cleared!');
                        this.game.lifecycle.endGame('VICTORY');
                        return;
                    }
                }
            }

            // Check for game over (no more letters remaining AND no pending words to clear)
            if (this.game.state.isGameOver() && !this.game.wordProcessor.hasPendingWords()) {
                this.game.lifecycle.endGame('GAME_OVER');
            }
        });
    }
}
