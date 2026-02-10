import { CONFIG, GameModes } from '../config.js';
import { FeatureManager } from './FeatureManager.js';
import { GameState } from './GameState.js';
import { DOMCache } from './DOMCache.js';
import { GameFlowController } from './GameFlowController.js';
import { ClearModeManager } from './ClearModeManager.js';
import { WordProcessor } from './WordProcessor.js';
import { AnimationController } from '../animation/AnimationController.js';
import { GridController } from '../grid/GridController.js';
import { LetterController } from '../letter/LetterController.js';
import { ScoreController } from '../scoring/ScoreController.js';
import { WordResolver } from '../word/WordResolver.js';
import { WordItem } from '../word/WordItem.js';
import { WordGracePeriodManager } from '../word/WordGracePeriodManager.js';
import { calculateWordScore } from '../scoring/ScoringUtils.js';
import { isValidColumn, calculateIndex, isWithinBounds } from '../grid/gridUtils.js';
import { AnimationSequencer } from '../animation/AnimationSequencer.js';
import { SEQUENCES } from '../animation/AnimationSequences.js';
import { StartSequenceController } from './StartSequenceController.js';
import { GameStateMachine, GamePhase } from './GameStateMachine.js';

/**
 * Tutorial UI state constants
 */
const TutorialUIState = { 
    INACTIVE: 'inactive',
    ACTIVE: 'active',
    COMPLETED: 'completed'
};

/**
 * Input buffer constants
 */
const INPUT_BUFFER_MS = 250;  // Prevent clicks within 250ms of last drop

/**
 * Game class - Main orchestrator that coordinates all controllers
 */
export class Game {
    constructor() {
        // Initialize core state and DOM cache
        this.state = new GameState();
        this.dom = new DOMCache();
        
        // Input buffering - prevent rapid clicks from stacking
        this.lastDropTime = 0;
        
        // Initialize feature manager
        this.features = new FeatureManager();
        
        // Tutorial UI state management
        this.tutorialUIState = TutorialUIState.INACTIVE;
        
        // Current game mode (defaults to CLASSIC)
        this.currentGameMode = GameModes.CLASSIC;
        
        // Initialize controllers
        this.grid = new GridController(this.state, this.dom);
        this.letters = new LetterController(this.state, this.dom);
        this.animator = new AnimationController(this.dom, this.features);
        this.score = new ScoreController(this.state, this.dom);
        this.wordResolver = null; // Will be initialized asynchronously
        
        // Initialize word grace period manager (handles word clearing with delay)
        this.gracePeriodManager = new WordGracePeriodManager(this.animator, {
            gracePeriodMs: CONFIG.GAME.WORD_GRACE_PERIOD_MS || 1000
        });
        
        // Initialize animation sequencer with all controllers
        this.sequencer = new AnimationSequencer({
            animator: this.animator,
            grid: this.grid,
            letters: this.letters,
            score: this.score,
            game: this  // Add game controller for timer methods
        }, this.features);
        
        // Load predefined sequences
        this.sequencer.loadSequences(SEQUENCES);
        
        // Initialize game state machine for tracking game phases
        this.stateMachine = new GameStateMachine();
        
        // Initialize flow controller (handles init, start, reset flows)
        this.flowController = new GameFlowController(
            this,
            this.stateMachine,
            this.sequencer,
            this.features,
            this.gracePeriodManager
        );
        
        // Initialize Clear Mode manager
        this.clearModeManager = new ClearModeManager(this, this.sequencer);
        
        // Initialize word processor (handles word detection and clearing)
        this.wordProcessor = new WordProcessor(this, this.gracePeriodManager);
        
        // Flag to prevent multiple simultaneous word checks
        this.isProcessingWords = false;
        this.wordCheckPending = false;
        this.wordDetectionEnabled = true;
        
        // Queue for serializing word expiration handling (prevents interleaved grid mutations)
        this.wordExpirationQueue = Promise.resolve();
        this.wordDetectionEnabled = true;
        
        // Flag to prevent re-entrance in START sequence (prevents multiple animations queueing)
        this.isStartDropInProgress = false;
        
        // Timer for initial user guidance (pulsate grid if no click within 5 seconds)
        this.inactivityTimer = null;
        this.hasClickedGrid = false;
        
        // START sequence controller
        this.startSequence = new StartSequenceController(this);
        
        // Validate PREVIEW_START config at construction time
        this.validatePreviewStartConfig();
    }
    
    /**
     * Validate that PREVIEW_START config is consistent with PREVIEW_COUNT
     */
    validatePreviewStartConfig() {
        const lettersLength = CONFIG.PREVIEW_START.LETTERS.length;
        const positionsLength = CONFIG.PREVIEW_START.POSITIONS.length;
        const previewCount = CONFIG.GAME.PREVIEW_COUNT;
        
        if (lettersLength !== previewCount) {
            console.warn(`Config mismatch: PREVIEW_START.LETTERS.length (${lettersLength}) !== PREVIEW_COUNT (${previewCount})`);
        }
        if (positionsLength !== lettersLength) {
            console.warn(`Config mismatch: PREVIEW_START.POSITIONS.length (${positionsLength}) !== LETTERS.length (${lettersLength})`);
        }
    }

    async init() {
        // Delegate to flow controller
        return await this.flowController.init();
    }
    
    // Public method for initializing dictionary (used internally by flowController)
    async initializeWordResolver() {
        this.wordResolver = await WordResolver.create(this.state, this.dom);
        return this.wordResolver;
    }

    setupEventListeners() {
        // Delegate to flow controller
        return this.flowController.setupEventListeners();
    }

    /**
     * Update tutorial UI visibility based on tutorial state
     * Single source of truth for tutorial UI state
     */
    updateTutorialUI() {
        const isActive = this.tutorialUIState === TutorialUIState.ACTIVE;
        if (this.dom.skipTutorialBtn) {
            this.dom.skipTutorialBtn.style.display = isActive ? 'block' : 'none';
        }
        
        if (this.features.isEnabled('debug.enabled')) {
            console.log(`Tutorial UI state: ${this.tutorialUIState}`);
        }
    }

    /**
     * Pause word detection globally (e.g., during START sequence)
     */
    pauseWordDetection() {
        // Delegate to word processor
        return this.wordProcessor.pause();
    }

    /**
     * Resume word detection globally
     */
    resumeWordDetection() {
        // Delegate to word processor
        return this.wordProcessor.resume();
    }

    async start(gameMode = GameModes.CLASSIC) {
        // Delegate to flow controller
        return await this.flowController.startGame(gameMode);
    }

    /**
     * Initialize Clear Mode - populate grid with ~50% letters
     */
    async initializeClearMode() {
        // Delegate to Clear Mode manager
        return await this.clearModeManager.initialize();
    }

    /**
     * Update UI elements for Clear Mode display
     */
    updateUIForClearMode() {
        // Delegate to Clear Mode manager
        return this.clearModeManager.updateUI();
    }

    /**
     * Update Clear Mode progress display
     */
    updateClearModeProgress() {
        // Delegate to Clear Mode manager
        return this.clearModeManager.updateProgress();
    }

    async reset() {
        // Delegate to flow controller
        return await this.flowController.resetGame();
    }

    handleSquareClick(e) {
        // Handle START sequence clicks (before game is started)
        if (this.startSequence.isActive && !this.state.started) {
            return this.handleStartSequenceClick(e);
        }
        
        if (!this.state.started) return;
        
        // Input buffer: prevent rapid clicks within 250ms
        if (Date.now() - this.lastDropTime < INPUT_BUFFER_MS) {
            return;
        }
        
        // Clear inactivity timer and stop pulsating on first grid click during gameplay
        if (!this.hasClickedGrid) {
            this.clearInactivityTimer();
            this.hasClickedGrid = true;
        }
        
        const column = parseInt(e.target.dataset.column);
        
        // Validate column using gridUtils for consistency
        if (!isValidColumn(column, CONFIG.GRID.COLUMNS)) {
            return;
        }
        
        // Check if column is full
        if (this.state.isColumnFull(column)) return;
        
        // Drop the letter
        this.dropLetter(column);
    }

    handleStartSequenceClick(e) {
        // Prevent re-entrance: ignore clicks while animation is in progress
        if (this.isStartDropInProgress) {
            console.log('START drop already in progress - ignoring click');
            return;
        }
        
        const column = parseInt(e.target.dataset.column);
        const row = parseInt(e.target.dataset.row);
        
        // Validate click position using controller
        if (!this.startSequence.isValidClick(column, row)) {
            const expected = this.startSequence.getCurrentExpectedPosition();
            console.log(`Wrong position! Expected column ${expected.column}, row ${expected.row}`);
            return;
        }
        
        // Correct click - proceed with letter drop
        const currentLetter = this.startSequence.getCurrentLetter();
        const targetRow = this.state.getLowestAvailableRow(column);
        
        // Check if THIS letter we're about to drop is the final one (before advancing)
        const isThisLastLetter = this.startSequence.currentIndex === CONFIG.PREVIEW_START.LETTERS.length - 1;
        
        console.log(`Correct! Clicking ${currentLetter} on position (${column}, ${row})`);
        
        // LOCK: Prevent re-entrance until animation completes
        this.isStartDropInProgress = true;
        
        // Remove glow from current square
        this.clearStartGuide();
        
        // Drop the letter with animation callback
        this.animator.dropLetterInColumn(column, currentLetter, targetRow, async () => {
            try {
                // Update game state after drop completes
                this.state.incrementColumnFill(column);
                
                // Advance to next letter
                this.startSequence.advance();
                
                // Update preview: remove first letter and shift remaining
                this.updateStartPreviewAfterDrop();
                
                console.log(`Dropped ${currentLetter} in column ${column}`);
                
                // Check if the letter we just placed was the final one
                if (isThisLastLetter) {
                    console.log('Final START letter placed - completing sequence');
                    await this.startSequence.complete();
                } else {
                    // Highlight the next square to click
                    this.highlightNextStartGuide();
                }
            } finally {
                // UNLOCK: Allow next click after callback completes
                this.isStartDropInProgress = false;
            }
        });
    }

    updateStartPreviewAfterDrop() {
        const previewBlocks = this.dom.preview.querySelectorAll('.preview-letter-block');
        const remainingLetters = CONFIG.PREVIEW_START.LETTERS.slice(this.startSequence.currentIndex);
        
        // Update preview blocks with remaining START letters
        previewBlocks.forEach((block, index) => {
            if (index < remainingLetters.length) {
                block.textContent = remainingLetters[index];
                // First remaining letter gets next-up styling
                if (index === 0) {
                    block.classList.add('next-up');
                } else {
                    block.classList.remove('next-up');
                }
            } else {
                // Empty blocks for remaining slots
                block.textContent = '';
                block.classList.remove('next-up');
                block.classList.add('empty');
            }
        });
    }

    /**
     * Highlight the next grid square in the START sequence
     */
    highlightNextStartGuide() {
        if (!this.startSequence.isActive || this.startSequence.currentIndex >= CONFIG.PREVIEW_START.LETTERS.length) {
            return; // START sequence not active or complete
        }
        
        const expected = this.startSequence.getCurrentExpectedPosition();
        const column = expected.column;

        // Highlight only the configured focus square for this letter
        const focusIndex = calculateIndex(expected.row, column, CONFIG.GRID.COLUMNS);
        const focusSquare = this.dom.getGridSquare(focusIndex);
        if (focusSquare) {
            focusSquare.classList.add('start-guide');
        }

        console.log(`Highlighting single square at row ${expected.row}, column ${column}`);
    }

    /**
     * Clear the current START guide highlight
     */
    clearStartGuide() {
        // Remove start-guide and focus classes from all highlighted squares
        const highlighted = this.dom.grid.querySelectorAll('.start-guide, .start-guide-focus');
        highlighted.forEach(sq => {
            sq.classList.remove('start-guide');
            sq.classList.remove('start-guide-focus');
        });
    }

    /**
     * Initialize the START sequence and highlight the first square
     */
    initStartSequenceGuide() {
        this.startSequence.start();
        this.highlightNextStartGuide();
        
        // Update tutorial UI state and visibility
        this.tutorialUIState = TutorialUIState.ACTIVE;
        this.updateTutorialUI();
    }

    /**
     * Skip the tutorial and go directly to the game
     */
    async skipTutorial() {
        if (!this.startSequence.isActive || this.state.started) {
            console.log('Tutorial not active or game already started');
            return;
        }
        
        console.log('Skipping tutorial...');
        
        // Clear any START sequence highlights
        this.clearStartGuide();
        
        // Complete the START sequence, skipping word processing since letters weren't placed
        await this.startSequence.complete(true);
        
        // Update tutorial UI state and hide button
        this.tutorialUIState = TutorialUIState.COMPLETED;
        this.updateTutorialUI();
        
        // Ensure preview remains visible after tutorial
        this.dom.preview.classList.add('visible');
    }

    dropLetter(column) {
        // Defensive validation
        if (!isValidColumn(column, CONFIG.GRID.COLUMNS)) {
            return;
        }
        if (this.state.isColumnFull(column)) {
            return;
        }
        
        const nextLetter = this.letters.getNextLetter();
        
        // Early guard: validate letter exists before any state mutations
        if (!nextLetter) {
            console.log('No more letters available - game over');
            return;  // Game over - don't mutate state
        }
        
        // Calculate target row FIRST based on current fills + pending (letters already in flight)
        const targetRow = this.state.getLowestAvailableRowWithPending(column);
        
        // NOW update game state (after calculating target row)
        // This prevents duplicate placements on rapid clicks
        this.state.incrementPendingFill(column);
        this.letters.advance();  // Update preview immediately
        this.score.updateLettersRemaining();  // Update counter immediately
        this.lastDropTime = Date.now();  // Update buffer timestamp
        
        // Use animation controller with callback
        this.animator.dropLetterInColumn(column, nextLetter, targetRow, async () => {
            // Finalize game state after animation completes
            this.state.decrementPendingFill(column);
            this.state.incrementColumnFill(column);
            
            // Transition to PLAYING phase on first letter drop (if not already playing)
            if (this.stateMachine.is(GamePhase.GAME_READY)) {
                this.stateMachine.transition(GamePhase.PLAYING);
            }
            
            // Update progress bar in NOODEL title
            this.animator.updateLetterProgress(
                this.state.lettersRemaining,
                CONFIG.GAME.INITIAL_LETTERS
            );
            
            // Check for words after the letter has been placed (if enabled)
            if (this.features.isEnabled('wordDetection')) {
                await this.checkAndProcessWords();
            }
        });
    }

    /**
     * Initialize game after START sequence completes
     * Handles NOODEL overlay drop and game component initialization
     */
    async initializeGameAfterStartSequence() {
        // Transition to game ready phase
        this.stateMachine.transition(GamePhase.GAME_READY);
        
        // Mark game as started
        this.state.started = true;
        this.dom.startBtn.textContent = '🔄';
        
        // Drop NOODEL overlay if it exists and await the animation
        const noodelOverlay = document.getElementById('noodel-word-overlay');
        if (noodelOverlay) {
            // Create NOODEL word item for the made words list
            const noodelDef = this.wordResolver?.dictionary?.get('NOODEL') || CONFIG.GAME_INFO.NOODEL_DEFINITION;
            const noodelScore = calculateWordScore('NOODEL');
            const noodelItem = new WordItem('NOODEL', noodelDef, noodelScore);

            // Drop the overlay and wait for animation to complete
            // Add NOODEL to the made-words list but do NOT alter game score.
            await this.animator.dropNoodelWordOverlay(() => {
                this.score.addWord(noodelItem, false);
            });
            
            // Show made-words container after NOODEL overlay drops
            if (this.dom.madeWordsContainer) {
                this.dom.madeWordsContainer.classList.add('visible');
            }
        }
        
        // Initialize progress bar
        this.animator.updateLetterProgress(
            this.state.lettersRemaining,
            CONFIG.GAME.INITIAL_LETTERS
        );
        
        // Show and populate letter preview
        this.dom.preview.classList.add('visible');
        
        // Initialize and display letters (ensure nextLetters are populated)
        this.letters.initialize();
        this.letters.display();
        
        console.log('Game fully initialized after START sequence!');
        // Enable scoring from this point forward (game has started)
        this.state.scoringEnabled = true;
    }

    // Check for words and add them to pending grace period queue
    /**
     * Check grid for words and process them with optional grace period
     */
    async checkAndProcessWords(addScore = true, useGracePeriod = true) {
        // Delegate to word processor
        return await this.wordProcessor.checkAndProcessWords(addScore, useGracePeriod);
    }

    /**
     * Process words immediately without grace period (used for START sequence)
     */
    async processWordsImmediately(foundWords, addScore) {
        // Delegate to word processor
        return await this.wordProcessor.processWordsImmediately(foundWords, addScore);
    }

    /**
     * Handle word expiration after grace period
     */
    async handleWordExpired(wordData, wordKey, origCallback) {
        // Delegate to word processor
        return await this.wordProcessor.handleWordExpired(wordData, wordKey, origCallback);
    }

    // Start timer to pulsate grid if user doesn't click within 5 seconds
    startInactivityTimer() {
        this.inactivityTimer = setTimeout(() => {
            if (!this.hasClickedGrid) {
                this.grid.startPulsating();
            }
        }, 5000);
    }

    /**
     * Handle Clear Mode completion
     */
    async handleClearModeComplete() {
        // Delegate to Clear Mode manager
        return await this.clearModeManager.handleComplete();
    }

    // Clear the inactivity timer and stop pulsating
    clearInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
        // Stop pulsating when user interacts
        this.grid.stopPulsating();
    }
}
