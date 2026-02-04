import { CONFIG, GameModes } from '../config.js';
import { FeatureManager } from './FeatureManager.js';
import { GameState } from './GameState.js';
import { DOMCache } from './DOMCache.js';
import { ClearModeInitializer } from './ClearModeInitializer.js';
import { LetterGenerator } from '../letter/LetterGenerator.js';
import { AnimationController } from '../animation/AnimationController.js';
import { GridController } from '../grid/GridController.js';
import { LetterController } from '../letter/LetterController.js';
import { ScoreController } from '../scoring/ScoreController.js';
import { WordResolver } from '../word/WordResolver.js';
import { WordItem } from '../word/WordItem.js';
import { calculateWordScore } from '../scoring/ScoringUtils.js';
import { isValidColumn, calculateIndex, isWithinBounds } from '../grid/gridUtils.js';
import { AnimationSequencer } from '../animation/AnimationSequencer.js';
import { SEQUENCES } from '../animation/AnimationSequences.js';
import { StartSequenceController } from './StartSequenceController.js';
import { GameStateMachine, GamePhase } from './GameStateMachine.js';

/**
 * Game class - Main orchestrator that coordinates all controllers
 */
export class Game {
    constructor() {
        // Initialize core state and DOM cache
        this.state = new GameState();
        this.dom = new DOMCache();
        
        // Initialize feature manager
        this.features = new FeatureManager();
        
        // Current game mode (defaults to CLASSIC)
        this.currentGameMode = GameModes.CLASSIC;
        
        // Initialize controllers
        this.grid = new GridController(this.state, this.dom);
        this.letters = new LetterController(this.state, this.dom);
        this.animator = new AnimationController(this.dom, this.features);
        this.score = new ScoreController(this.state, this.dom);
        this.wordResolver = null; // Will be initialized asynchronously
        
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
        
        // Flag to prevent multiple simultaneous word checks
        this.isProcessingWords = false;
        
        // Flag to control word detection globally (can be paused for sequences)
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
        // Note: GameStateMachine starts in LOADING phase by default
        // Load dictionary and initialize WordResolver
        console.log('Loading dictionary...');
        this.wordResolver = await WordResolver.create(this.state, this.dom);
        console.log('Dictionary loaded successfully!');
        
        // Initialize score display with config values
        this.score.init();
        
        // Setup grid and letters
        this.grid.generate();
        // Note: displayPreviewStart() will be called by the intro animation sequence
        
        // Load debug grid if enabled (for testing word detection)
        if (this.features.isEnabled('debug.enabled') && this.features.isEnabled('debug.gridPattern')) {
            this.grid.loadDebugGrid();
        }
        
        // Create shared context for sequence execution
        const context = {
            dictionary: this.wordResolver.dictionary,
            state: this.state,
            dom: this.dom,
            score: this.score,
            letters: this.letters,
            game: this
        };
        
        // Transition to intro animation phase
        this.stateMachine.transition(GamePhase.INTRO_ANIMATION);
        
        // Play appropriate intro sequence based on debug mode
        if (this.features.isEnabled('debug.enabled')) {
            await this.sequencer.play('debugIntro', context);
        } else {
            await this.sequencer.play('intro', context);
        }
        
        // Transition to START sequence phase
        this.stateMachine.transition(GamePhase.START_SEQUENCE);
        
        // Store noodelItem for later use in start()
        this.noodelItem = context.noodelItem;
        
        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Start/Reset button
        this.dom.startBtn.addEventListener('click', () => {
            if (!this.state.started) {
                this.start();
            } else {
                this.reset();
            }
        });
        
        // Mute button
        this.dom.muteBtn.addEventListener('click', () => {
            this.dom.muteBtn.textContent = this.dom.muteBtn.textContent === '🔊' ? '🔇' : '🔊';
        });
        
        // Setup grid click handlers once during initialization
        this.grid.addClickHandlers((e) => this.handleSquareClick(e));
    }

    /**
     * Pause word detection globally (e.g., during START sequence)
     */
    pauseWordDetection() {
        this.wordDetectionEnabled = false;
        console.log('Word detection paused');
    }

    /**
     * Resume word detection globally
     */
    resumeWordDetection() {
        this.wordDetectionEnabled = true;
        console.log('Word detection resumed');
    }

    async start(gameMode = GameModes.CLASSIC) {
        // Clear inactivity timer when menu button is clicked
        this.clearInactivityTimer();
        this.hasClickedGrid = true;
        
        // Set game mode
        this.currentGameMode = gameMode;
        this.state.gameMode = gameMode;
        this.state.isClearMode = gameMode === GameModes.CLEAR;
        
        this.state.started = true;
        this.dom.startBtn.textContent = '🔄';
        
        // Handle mode-specific setup before game start sequence
        if (gameMode === GameModes.CLEAR) {
            await this.initializeClearMode();
        }
        
        // Create context for game start sequence
        const context = {
            noodelItem: this.noodelItem,
            state: this.state,
            dom: this.dom,
            score: this.score,
            dictionary: this.wordResolver?.dictionary
        };
        
        // Play game start sequence
        await this.sequencer.play('gameStart', context);
        
        // Clear noodelItem reference after it's been added
        this.noodelItem = null;
        
        // Click handlers are already set up in setupEventListeners()
        // No need to add them again here
        
        // Reset flag for gameplay inactivity tracking
        this.hasClickedGrid = false;
        
        // Start new inactivity timer for gameplay (pulsate if no click within 5 seconds)
        this.startInactivityTimer();
    }

    /**
     * Initialize Clear Mode - populate grid with ~50% letters
     */
    async initializeClearMode() {
        console.log('Initializing Clear Mode...');
        
        // Create a letter generator for initial population
        const letterGenerator = new LetterGenerator(CONFIG.GAME.INITIAL_LETTERS);
        
        // Populate grid with ~50% letters
        const populatedCells = ClearModeInitializer.populateGridWithLetters(
            this.state,
            letterGenerator
        );
        
        // Apply to DOM
        ClearModeInitializer.applyGridPopulation(this.dom.grid, populatedCells);
        ClearModeInitializer.updateGameState(this.state, populatedCells);
        
        // Update UI for Clear Mode
        this.updateUIForClearMode();
        
        console.log(`Clear Mode initialized: ${populatedCells.length} cells populated (target: ${this.state.targetCellsToClear})`);
    }

    /**
     * Update UI elements for Clear Mode display
     */
    updateUIForClearMode() {
        // Update stats label
        const labels = this.dom.stats.querySelectorAll('.stat-label');
        labels.forEach(label => {
            if (label.textContent.includes('Letters')) {
                label.textContent = 'Grid Progress';
                label.classList.add('clear-mode');
            }
        });
        
        // Update progress display
        this.updateClearModeProgress();
    }

    /**
     * Update Clear Mode progress display
     */
    updateClearModeProgress() {
        if (this.state.isClearMode) {
            const remainingCells = this.state.targetCellsToClear - this.state.cellsClearedCount;
            const progressPercent = Math.round(this.state.getClearModeProgress());
            
            // Update progress display (e.g., "45/21" for remaining/total)
            const lettersDisplay = this.dom.lettersRemaining;
            if (lettersDisplay) {
                lettersDisplay.textContent = `${remainingCells}/${this.state.targetCellsToClear}`;
            }
            
            // Update progress bar if available
            if (this.animator && this.animator.updateLetterProgress) {
                this.animator.updateLetterProgress(remainingCells, this.state.targetCellsToClear);
            }
        }
    }

    async reset() {
        // Clear inactivity timer
        this.clearInactivityTimer();
        this.hasClickedGrid = true;
        
        // Reset game state with current game mode (score, letters, grid data)
        this.state.reset();
        // Preserve the game mode across resets
        this.state.gameMode = this.currentGameMode;
        this.state.isClearMode = this.currentGameMode === GameModes.CLEAR;
        
        // Reset all controller displays (this updates the DOM)
        this.score.displayReset();
        this.grid.displayReset();
        this.letters.displayReset();
        
        // Shake NOODEL title and preview letters to indicate new state
        await Promise.all([
            this.animator.shakeAllTitleLetters(),
            this.animator.shakePreviewLetters()
        ]);
        
        // Update button to show reset icon
        this.dom.startBtn.textContent = '🔄';
        
        // Mark game as started
        this.state.started = true;
        
        // Handle mode-specific setup before game start sequence
        if (this.currentGameMode === GameModes.CLEAR) {
            await this.initializeClearMode();
        }
        
        // Create context for game start sequence
        const context = {
            noodelItem: null, // Will be created in sequence
            state: this.state,
            dom: this.dom,
            score: this.score,
            dictionary: this.wordResolver?.dictionary
        };
        
        // Play game start sequence (adds NOODEL word to the list)
        await this.sequencer.play('gameStart', context);
        
        // Re-add click handlers after grid regeneration
        this.grid.addClickHandlers((e) => this.handleSquareClick(e));
        
        // Reset flag for gameplay inactivity tracking
        this.hasClickedGrid = false;
        
        // Start new inactivity timer for gameplay
        this.startInactivityTimer();
    }

    handleSquareClick(e) {
        // Handle START sequence clicks (before game is started)
        if (this.startSequence.isActive && !this.state.started) {
            return this.handleStartSequenceClick(e);
        }
        
        if (!this.state.started) return;
        
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
    }

    dropLetter(column) {
        const nextLetter = this.letters.getNextLetter();
        const targetRow = this.state.getLowestAvailableRow(column);
        
        // Calculate the index where the letter will be placed
        // calculateIndex is imported from gridUtils.js
        const placedCellIndex = calculateIndex(targetRow, column, CONFIG.GRID.COLUMNS);
        
        // Use animation controller with callback
        this.animator.dropLetterInColumn(column, nextLetter, targetRow, async () => {
            // Cancel any active resolve graces that intersect with the placed cell
            this.animator.cancelResolveGracesIntersecting(placedCellIndex);
            
            // Update game state after animation completes
            this.state.incrementColumnFill(column);
            this.letters.advance();
            this.score.updateLettersRemaining();
            
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

    // Check for words and process them with animation
    async checkAndProcessWords(addScore = true) {
        // Skip if word detection is paused (e.g., during sequences)
        if (!this.wordDetectionEnabled) {
            console.log('Word detection is paused');
            return;
        }
        
        // Prevent overlapping word processing
        if (this.isProcessingWords) return;
        this.isProcessingWords = true;
        
        // Transition to word processing phase
        if (this.stateMachine.is(GamePhase.PLAYING)) {
            this.stateMachine.transition(GamePhase.WORD_PROCESSING);
        }
        
        try {
            // Keep checking for words until no more are found (each iteration is a new game state)
            let wordsFound = true;
            while (wordsFound) {
                const foundWords = this.wordResolver.checkForWords();
                
                // Check if word highlighting animation is enabled
                const shouldAnimate = this.features.isEnabled('animations.wordHighlight');
                
                if (foundWords.length > 0) {
                    // Start resolve grace animation for all words (if enabled)
                    if (shouldAnimate) {
                        // Start resolve controllers for each found word
                        const resolveControllers = foundWords.map(wordData => 
                            this.animator.startResolveGrace(wordData.positions, 1000)
                        );
                        
                        // Wait for all grace periods to complete
                        await Promise.all(resolveControllers.map(c => c.promise));
                        
                        // Finalize each controller
                        resolveControllers.forEach(c => {
                            this.animator.finalizeResolveGrace(c);
                        });
                    }
                    
                    // Add all words to made words list (if addScore is true)
                    foundWords.forEach(wordData => {
                        const points = calculateWordScore(wordData.word); // Calculate points using Scrabble values + length bonus
                        const wordItem = new WordItem(wordData.word, wordData.definition, points);

                        const willDisplay = addScore; // preserve original behavior: only display when addScore is true
                        const willAddToScore = addScore && this.state.scoringEnabled;

                        if (willDisplay) {
                            this.score.addWord(wordItem, willAddToScore);
                            if (!willAddToScore) {
                                console.log(`Word "${wordData.word}" detected but not added to score (scoring disabled)`);
                            }
                        } else {
                            console.log(`Word "${wordData.word}" detected but not added to score (START sequence)`);
                        }
                        
                        // Track cleared cells for Clear Mode
                        if (this.state.isClearMode) {
                            this.state.cellsClearedCount += wordData.positions.length;
                        }
                    });
                    
                    // Check if Clear Mode is complete
                    if (this.state.isClearMode && this.state.cellsClearedCount >= this.state.targetCellsToClear) {
                        // Update progress display before showing victory
                        this.updateClearModeProgress();
                        
                        // Handle Clear Mode complete
                        await this.handleClearModeComplete();
                        this.isProcessingWords = false;
                        return;
                    }
                    
                    // Update progress display for Clear Mode
                    if (this.state.isClearMode) {
                        this.updateClearModeProgress();
                    }
                    
                    // Clear all word cells after animation
                    foundWords.forEach(wordData => {
                        this.animator.clearWordCells(wordData.positions);
                    });
                    
                    // Wait a bit before applying gravity (if animation was shown)
                    if (shouldAnimate) {
                        const root = getComputedStyle(document.documentElement);
                        const wordClearDelay = parseFloat(root.getPropertyValue('--animation-delay-word-clear').trim());
                        await new Promise(resolve => 
                            setTimeout(resolve, wordClearDelay)
                        );
                    }
                    
                    // Apply gravity to drop letters down (creates new game state) - if enabled
                    if (this.features.isEnabled('gravityPhysics')) {
                        this.grid.applyGravity();
                    }
                    
                    // Short delay before checking for new words in the new game state
                    await new Promise(resolve => setTimeout(resolve, 300));
                } else {
                    wordsFound = false;
                }
            }
        } finally {
            this.isProcessingWords = false;
            
            // Transition back to PLAYING phase after word processing completes
            if (this.stateMachine.is(GamePhase.WORD_PROCESSING)) {
                this.stateMachine.transition(GamePhase.PLAYING);
            }
        }
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
        console.log('🎉 Clear Mode Complete!');
        
        this.state.started = false;
        this.dom.startBtn.textContent = '🎮';
        
        // Create context for victory sequence
        const context = {
            state: this.state,
            dom: this.dom,
            score: this.score,
            animator: this.animator,
            finalScore: this.state.score,
            game: this
        };
        
        // Play Clear Mode complete sequence (animations + restart option)
        if (this.sequencer && this.sequencer.sequences && this.sequencer.sequences['clearModeComplete']) {
            await this.sequencer.play('clearModeComplete', context);
        } else {
            // Fallback if sequence not defined yet - restart the game via START sequence
            console.log('Clear Mode complete sequence not yet defined, restarting via reset');
            this.reset();
        }
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
