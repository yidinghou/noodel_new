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
import { WordGracePeriodManager } from '../word/WordGracePeriodManager.js';
import { AnimationSequencer } from '../animation/AnimationSequencer.js';
import { SEQUENCES } from '../animation/AnimationSequences.js';
import { StartSequenceController } from './StartSequenceController.js';
import { GameStateMachine } from './GameStateMachine.js';
import { TutorialUIState } from './gameConstants.js';
import { GameInputController } from './GameInputController.js';
import { StartSequenceUI } from './StartSequenceUI.js';
import { GameLifecycleManager } from './GameLifecycleManager.js';

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
        
        // Ensure grace period expiration always calls the word processor's handler
        this.gracePeriodManager.setOnWordExpired(
            this.wordProcessor.handleWordExpired.bind(this.wordProcessor)
        );

        // Flag to prevent multiple simultaneous word checks
        this.isProcessingWords = false;
        this.wordCheckPending = false;
        this.wordDetectionEnabled = true;
        
        // Queue for serializing word expiration handling (prevents interleaved grid mutations)
        this.wordExpirationQueue = Promise.resolve();
        this.wordDetectionEnabled = true;
        
        // Flag to prevent re-entrance in START sequence (prevents multiple animations queueing)
        this.isStartDropInProgress = false;
        
        // START sequence controller
        this.startSequence = new StartSequenceController(this);
        
        // Initialize manager modules for cleaner separation of concerns
        this.input = new GameInputController(this);
        this.startUI = new StartSequenceUI(this);
        this.lifecycle = new GameLifecycleManager(this);
        
        // Validate PREVIEW_START config at construction time
        this.lifecycle.validatePreviewStartConfig();
    }
    
    /**
     * Validate that PREVIEW_START config is consistent with PREVIEW_COUNT
     */
    validatePreviewStartConfig() {
        return this.lifecycle.validatePreviewStartConfig();
    }

    async init() {
        return await this.lifecycle.init();
    }
    
    async initializeWordResolver() {
        return await this.lifecycle.initializeWordResolver();
    }

    setupEventListeners() {
        return this.flowController.setupEventListeners();
    }

    /**
     * Update tutorial UI visibility based on tutorial state
     * Single source of truth for tutorial UI state
     */
    updateTutorialUI() {
        return this.startUI.updateTutorialUI();
    }

    /**
     * Pause word detection globally (e.g., during START sequence)
     */
    pauseWordDetection() {
        return this.wordProcessor.pause();
    }

    /**
     * Resume word detection globally
     */
    resumeWordDetection() {
        return this.wordProcessor.resume();
    }

    async start(gameMode = GameModes.CLASSIC) {
        return await this.lifecycle.start(gameMode);
    }

    /**
     * Initialize Clear Mode - populate grid with ~50% letters
     */
    async initializeClearMode() {
        return await this.lifecycle.initializeClearMode();
    }

    /**
     * Update UI elements for Clear Mode display
     */
    updateUIForClearMode() {
        return this.lifecycle.updateUIForClearMode();
    }

    /**
     * Update Clear Mode progress display
     */
    updateClearModeProgress() {
        return this.lifecycle.updateClearModeProgress();
    }

    async reset() {
        return await this.lifecycle.reset();
    }

    handleSquareClick(e) {
        return this.input.handleSquareClick(e);
    }

    handleStartSequenceClick(e) {
        return this.input.handleStartSequenceClick(e);
    }

    updateStartPreviewAfterDrop() {
        return this.startUI.updateStartPreviewAfterDrop();
    }

    /**
     * Highlight the next grid square in the START sequence
     */
    highlightNextStartGuide() {
        return this.startUI.highlightNextStartGuide();
    }

    /**
     * Clear the current START guide highlight
     */
    clearStartGuide() {
        return this.startUI.clearStartGuide();
    }

    /**
     * Initialize the START sequence and highlight the first square
     */
    initStartSequenceGuide() {
        return this.startUI.initStartSequenceGuide();
    }

    /**
     * Skip the tutorial and go directly to the game
     */
    async skipTutorial() {
        return await this.startUI.skipTutorial();
    }

    dropLetter(column) {
        return this.input.dropLetter(column);
    }

    /**
     * Initialize game after START sequence completes
     * Handles NOODEL overlay drop and game component initialization
     */
    async initializeGameAfterStartSequence() {
        return await this.lifecycle.initializeGameAfterStartSequence();
    }

    /**
     * Check grid for words and process them with optional grace period
     */
    async checkAndProcessWords(addScore = true, useGracePeriod = true) {
        return await this.wordProcessor.checkAndProcessWords(addScore, useGracePeriod);
    }

    /**
     * Process words immediately without grace period (used for START sequence)
     */
    async processWordsImmediately(foundWords, addScore) {
        return await this.wordProcessor.processWordsImmediately(foundWords, addScore);
    }

    /**
     * Handle word expiration after grace period
     */
    async handleWordExpired(wordData, wordKey, origCallback) {
        return await this.wordProcessor.handleWordExpired(wordData, wordKey, origCallback);
    }

    // Start timer to pulsate grid if user doesn't click within 5 seconds
    startInactivityTimer() {
        return this.input.startInactivityTimer();
    }

    /**
     * Handle Clear Mode completion
     */
    async handleClearModeComplete() {
        return await this.lifecycle.handleClearModeComplete();
    }

    // Clear the inactivity timer and stop pulsating
    clearInactivityTimer() {
        return this.input.clearInactivityTimer();
    }
}
