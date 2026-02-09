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
        
        // Flag to prevent multiple simultaneous word checks
        this.isProcessingWords = false;
        this.wordCheckPending = false;
        
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
        // Note: GameStateMachine starts in LOADING phase by default
        // Load dictionary and initialize WordResolver
        console.log('Loading dictionary...');
        this.wordResolver = await WordResolver.create(this.state, this.dom);
        console.log('Dictionary loaded successfully!');
        
        // Set up word grace period manager's expiration callback
        this.gracePeriodManager.setOnWordExpired(
            (wordData, wordKey, origCallback) => this.handleWordExpired(wordData, wordKey, origCallback)
        );
        
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
        
        // Skip Tutorial button
        if (this.dom.skipTutorialBtn) {
            this.dom.skipTutorialBtn.addEventListener('click', () => {
                this.skipTutorial();
            });
        }
        
        // Setup grid click handlers once during initialization
        this.grid.addClickHandlers((e) => this.handleSquareClick(e));
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
        
        // Toggle letters remaining visibility based on tutorial state
        if (this.dom.lettersRemainingContainer) {
            if (isActive) {
                this.dom.lettersRemainingContainer.classList.remove('visible');
            } else {
                this.dom.lettersRemainingContainer.classList.add('visible');
            }
        }
        
        if (this.features.isEnabled('debug.enabled')) {
            console.log(`Tutorial UI state: ${this.tutorialUIState}`);
        }
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
        // Update letters remaining label to show grid progress
        const label = this.dom.lettersRemainingContainer?.querySelector('.letters-remaining-label');
        if (label) {
            label.textContent = 'Grid Progress';
            label.classList.add('clear-mode');
        }
        
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
            
            // Update progress display (e.g., "45/100" for remaining/total)
            if (this.dom.lettersRemainingValue) {
                this.dom.lettersRemainingValue.textContent = `${remainingCells}/${this.state.targetCellsToClear}`;
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
        
        // Reset input buffer
        this.lastDropTime = 0;
        
        // Clear any pending words with grace period
        this.gracePeriodManager.clearAll();
        
        // Reset game state with current game mode (score, letters, grid data)
        this.state.reset();
        // Preserve the game mode across resets
        this.state.gameMode = this.currentGameMode;
        this.state.isClearMode = this.currentGameMode === GameModes.CLEAR;
        
        // Reset all controller displays (this updates the DOM)
        this.score.displayReset();
        this.grid.displayReset();
        // Note: letters will be initialized and displayed by gameStart sequence
        
        // Shake NOODEL title to indicate new state
        // (preview letters will be animated as part of gameStart sequence)
        await this.animator.shakeAllTitleLetters();
        
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
            const foundWords = this.wordResolver.checkForWords();
            
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
            if (wordData.word === 'START' && this.tutorialUIState === TutorialUIState.ACTIVE) {
                console.log('START word found - completing tutorial');
                this.tutorialUIState = TutorialUIState.COMPLETED;
                this.updateTutorialUI();
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
     * Process words immediately without grace period (used for START sequence)
     * This is the old behavior before grace period was added
     */
    async processWordsImmediately(foundWords, addScore) {
        // Check if word highlighting animation is enabled
        const shouldAnimate = this.features.isEnabled('animations.wordHighlight');
        
        if (shouldAnimate) {
            const animationPromises = foundWords.map(wordData => 
                this.animator.highlightAndShakeWord(wordData.positions)
            );
            await Promise.all(animationPromises);
        }
        
        // Add all words to made words list (if addScore is true)
        foundWords.forEach(wordData => {
            const points = calculateWordScore(wordData.word);
            const wordItem = new WordItem(wordData.word, wordData.definition, points);

            const willDisplay = addScore;
            const willAddToScore = addScore && this.state.scoringEnabled;

            if (willDisplay) {
                this.score.addWord(wordItem, willAddToScore);
            }
            
            // Track cleared cells for Clear Mode
            if (this.state.isClearMode) {
                this.state.cellsClearedCount += wordData.positions.length;
            }
        });
        
        // Clear all word cells after animation
        foundWords.forEach(wordData => {
            this.animator.clearWordCells(wordData.positions);
        });
        
        // Wait a bit before applying gravity (if animation was shown)
        if (shouldAnimate) {
            const root = getComputedStyle(document.documentElement);
            const wordClearDelay = parseFloat(root.getPropertyValue('--animation-delay-word-clear').trim());
            await new Promise(resolve => setTimeout(resolve, wordClearDelay));
        }
        
        // Apply gravity to drop letters down - if enabled
        if (this.features.isEnabled('gravityPhysics')) {
            this.grid.applyGravity();
        } else {
            // Even without gravity, update column fill counts based on actual grid state
            this.grid.updateColumnFillCounts();
        }
                
        // Short delay before checking for new words
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check for cascading words (also immediately)
        const cascadeWords = this.wordResolver.checkForWords();
        if (cascadeWords.length > 0) {
            await this.processWordsImmediately(cascadeWords, addScore);
        }
    }

    /**
     * Handle word expiration after grace period
     * Called when a pending word's 1-second timer expires
     * Serialized through wordExpirationQueue to prevent concurrent grid mutations
     */
    async handleWordExpired(wordData, wordKey, origCallback) {
        // Chain this expiration to the queue to serialize grid mutations
        this.wordExpirationQueue = this.wordExpirationQueue.then(async () => {
            // Staleness guard: skip if word was already cleared (reset may have happened)
            if (!this.gracePeriodManager.pendingWords.has(wordKey)) {
                console.log(`Word already cleared: ${wordKey}`);
                return;
            }
            
            console.log(`Word grace period expired: ${wordData.word}`);
            
            // Pause word detection during clearing to prevent new words from being
            // detected using cells that are mid-animation/about to be removed
            this.wordDetectionEnabled = false;
            
            // Add word to display now that it's confirmed final
            const points = calculateWordScore(wordData.word);
            const wordItem = new WordItem(wordData.word, wordData.definition, points);
            const willAddToScore = this.state.scoringEnabled;
            this.score.addWord(wordItem, willAddToScore);
            
            // First, clear the pending animation (remove word-pending class)
            this.animator.clearWordPendingAnimation(wordData.positions);
            
            // Animate word shake
            const shouldAnimate = this.features.isEnabled('animations.wordHighlight');
            if (shouldAnimate) {
                await this.animator.highlightAndShakeWord(wordData.positions);
            }
            
            // Clear word cells from grid
            this.animator.clearWordCells(wordData.positions);
            
            // Track cleared cells for Clear Mode
            if (this.state.isClearMode) {
                this.state.cellsClearedCount += wordData.positions.length;
            }
            
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
            if (this.features.isEnabled('gravityPhysics')) {
                this.grid.applyGravity();
            } else {
                // Even without gravity, update column fill counts based on actual grid state
                this.grid.updateColumnFillCounts();
            }
            
            // Check if Clear Mode is complete
            if (this.state.isClearMode && this.state.cellsClearedCount >= this.state.targetCellsToClear) {
                // Update progress display before showing victory
                this.updateClearModeProgress();
                
                // Handle Clear Mode complete
                await this.handleClearModeComplete();
                this.wordDetectionEnabled = true;
                return;
            }
            
            // Update progress display for Clear Mode
            if (this.state.isClearMode) {
                this.updateClearModeProgress();
            }
            
            // Short delay before checking for new words (cascade effect after gravity)
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Re-enable word detection now that cells are settled
            this.wordDetectionEnabled = true;
            
            // Recursively check for new words from cascading (gravity creates new words)
            await this.checkAndProcessWords(true);  // addScore=true for cascaded words
        });
        
        return this.wordExpirationQueue;
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
