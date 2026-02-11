import { CONFIG, GameModes } from '../config.js';
import { FeatureManager } from './FeatureManager.js';
import { GameState } from './GameState.js';
import { DOMCache } from './DOMCache.js';
import { GameFlowController } from './GameFlowController.js';
import { WordProcessor } from './WordProcessor.js';
import { AnimationController } from '../animation/AnimationController.js';
import { AnimationOrchestrator } from '../animation/AnimationOrchestrator.js';
import { GridController } from '../grid/GridController.js';
import { LetterController } from '../letter/LetterController.js';
import { ScoreController } from '../scoring/ScoreController.js';
import { WordGracePeriodManager } from '../word/WordGracePeriodManager.js';
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
        this.initializeCoreServices();
        this.initializeControllers();
        this.initializeAnimationSystem();
        this.initializeWordProcessing();
        this.initializeStateFlags();
        this.initializeManagerModules();
        this.validateConfig();
    }

    /**
     * Initialize core state management and UI cache
     */
    initializeCoreServices() {
        this.state = new GameState();
        this.dom = new DOMCache();
        this.features = new FeatureManager();
        this.tutorialUIState = TutorialUIState.INACTIVE;
        this.currentGameMode = GameModes.CLASSIC;
    }

    /**
     * Initialize all game controllers (grid, letters, animator, score)
     */
    initializeControllers() {
        this.grid = new GridController(this.state, this.dom);
        this.letters = new LetterController(this.state, this.dom);
        this.animator = new AnimationController(this.dom, this.features);
        this.score = new ScoreController(this.state, this.dom);
        this.wordResolver = null; // Will be initialized asynchronously
    }

    /**
     * Initialize animation system (orchestrator, state machine, flow controller)
     */
    initializeAnimationSystem() {
        // Initialize word grace period manager (handles word clearing with delay)
        this.gracePeriodManager = new WordGracePeriodManager(this.animator, {
            gracePeriodMs: CONFIG.GAME.WORD_GRACE_PERIOD_MS || 1000
        });
        
        // Initialize animation orchestrator with all controllers
        this.sequencer = new AnimationOrchestrator({
            animator: this.animator,
            grid: this.grid,
            letters: this.letters,
            score: this.score,
            game: this
        }, this.features);
        
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
        
        // Initialize START sequence controller
        this.startSequence = new StartSequenceController(this);
    }

    /**
     * Initialize word detection and processing system
     */
    initializeWordProcessing() {
        // Initialize word processor (handles word detection and clearing)
        this.wordProcessor = new WordProcessor(this, this.gracePeriodManager);
        
        // Ensure grace period expiration always calls the word processor's handler
        this.gracePeriodManager.setOnWordExpired(
            this.wordProcessor.handleWordExpired.bind(this.wordProcessor)
        );
    }

    /**
     * Initialize state flags and internal tracking variables
     */
    initializeStateFlags() {
        // Flag to prevent multiple simultaneous word checks
        this.isProcessingWords = false;
        this.wordCheckPending = false;
        this.wordDetectionEnabled = true;
        
        // Queue for serializing word expiration handling (prevents interleaved grid mutations)
        this.wordExpirationQueue = Promise.resolve();
        
        // Flag to prevent re-entrance in START sequence
        this.isStartDropInProgress = false;
    }

    /**
     * Initialize specialized manager modules for cleaner separation of concerns
     */
    initializeManagerModules() {
        this.input = new GameInputController(this);
        this.startUI = new StartSequenceUI(this);
        this.lifecycle = new GameLifecycleManager(this);
    }

    /**
     * Validate configuration at construction time
     */
    validateConfig() {
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
     * Initialize tutorial state during game initialization
     */
    initTutorialState() {
        return this.startUI.initTutorialState();
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
}
