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
import { MenuController } from '../menu/MenuController.js';
import { StartMenuPreview } from '../menu/StartMenuPreview.js';
import { AnimationSequencer } from '../animation/AnimationSequencer.js';
import { SEQUENCES } from '../animation/AnimationSequences.js';

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
        
        // Initialize menu controller with callbacks
        this.menu = new MenuController(
            this.dom,
            () => this.start(),           // onStart callback
            () => this.handleLogin(),     // onLogin callback
            () => this.handleMore()       // onMore callback
        );
        
        // Initialize START menu preview (alternative to grid-based menu)
        this.startMenuPreview = new StartMenuPreview(
            this.dom,
            () => this.startFromPreview() // onStart callback
        );
        
        // Initialize animation sequencer with all controllers
        this.sequencer = new AnimationSequencer({
            animator: this.animator,
            menu: this.menu,
            startMenuPreview: this.startMenuPreview,
            grid: this.grid,
            letters: this.letters,
            score: this.score,
            game: this  // Add game controller for timer methods
        }, this.features);
        
        // Load predefined sequences
        this.sequencer.loadSequences(SEQUENCES);
        
        // Flag to prevent multiple simultaneous word checks
        this.isProcessingWords = false;
        
        // Timer for initial user guidance (pulsate grid if no click within 5 seconds)
        this.inactivityTimer = null;
        this.hasClickedGrid = false;
    }

    async init() {
        // Load dictionary and initialize WordResolver
        console.log('Loading dictionary...');
        this.wordResolver = await WordResolver.create(this.state, this.dom);
        console.log('Dictionary loaded successfully!');
        
        // Initialize score display with config values
        this.score.init();
        
        // Setup grid and letters
        this.grid.generate();
        this.letters.initialize();
        
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
            game: this
        };
        
        // Play appropriate intro sequence based on debug mode
        if (this.features.isEnabled('debug.enabled')) {
            await this.sequencer.play('debugIntro', context);
        } else {
            await this.sequencer.play('intro', context);
        }
        
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

    /**
     * Start game from preview menu (runs START animation sequence)
     */
    async startFromPreview() {
        // Clear inactivity timer
        this.clearInactivityTimer();
        this.hasClickedGrid = true;
        
        this.state.started = true;
        this.dom.startBtn.textContent = '🔄';
        
        // Create context for animation sequence
        const context = {
            noodelItem: this.noodelItem,
            state: this.state,
            dom: this.dom,
            score: this.score,
            animator: this.animator,
            letterController: this.letters,
            startMenuPreview: this.startMenuPreview,
            dictionary: this.wordResolver?.dictionary
        };
        
        // Play START preview game start sequence
        await this.sequencer.play('startPreviewGameStart', context);
        
        // Clear noodelItem reference after it's been added
        this.noodelItem = null;
        
        // Add click handlers to grid squares
        this.grid.addClickHandlers((e) => this.handleSquareClick(e));
        
        // Reset flag for gameplay inactivity tracking
        this.hasClickedGrid = false;
        
        // Start new inactivity timer for gameplay
        this.startInactivityTimer();
    }

    handleLogin() {
        // Clear inactivity timer when menu button is clicked
        this.clearInactivityTimer();
        this.hasClickedGrid = true;
        
        console.log('Login button clicked');
        alert('Login feature coming soon!');
    }

    handleMore() {
        // Clear inactivity timer when menu button is clicked
        this.clearInactivityTimer();
        this.hasClickedGrid = true;
        
        console.log('More button clicked');
        const choice = confirm('More options:\n\nWould you like to reset the game?');
        if (choice && this.menu) {
            this.menu.hide();
            this.reset();
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
        // Don't process clicks when menu is active
        if (this.menu && this.menu.isActive()) return;
        if (this.startMenuPreview && this.startMenuPreview.isMenuActive()) return;
        
        if (!this.state.started) return;
        
        // Clear inactivity timer and stop pulsating on first grid click during gameplay
        if (!this.hasClickedGrid) {
            this.clearInactivityTimer();
            this.hasClickedGrid = true;
        }
        
        const column = parseInt(e.target.dataset.column);
        
        // Validate column (silent failure for consistency with GridController)
        if (isNaN(column) || column < 0 || column >= CONFIG.GRID.COLUMNS) {
            return;
        }
        
        // Check if column is full
        if (this.state.isColumnFull(column)) return;
        
        // Drop the letter
        this.dropLetter(column);
    }

    dropLetter(column) {
        const nextLetter = this.letters.getNextLetter();
        const targetRow = this.state.getLowestAvailableRow(column);
        
        // Use animation controller with callback
        this.animator.dropLetterInColumn(column, nextLetter, targetRow, async () => {
            // Update game state after animation completes
            this.state.incrementColumnFill(column);
            this.letters.advance();
            this.score.updateLettersRemaining();
            
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

    // Check for words and process them with animation
    async checkAndProcessWords() {
        // Prevent overlapping word processing
        if (this.isProcessingWords) return;
        this.isProcessingWords = true;
        
        try {
            // Keep checking for words until no more are found (each iteration is a new game state)
            let wordsFound = true;
            while (wordsFound) {
                const foundWords = this.wordResolver.checkForWords();
                
                // Check if word highlighting animation is enabled
                const shouldAnimate = this.features.isEnabled('animations.wordHighlight');
                
                if (foundWords.length > 0) {
                    // Animate all words in this game state SIMULTANEOUSLY (if enabled)
                    if (shouldAnimate) {
                        const animationPromises = foundWords.map(wordData => 
                            this.animator.highlightAndShakeWord(wordData.positions)
                        );
                        
                        // Wait for all animations to complete together
                        await Promise.all(animationPromises);
                    }
                    
                    // Add all words to made words list
                    foundWords.forEach(wordData => {
                        const points = calculateWordScore(wordData.word); // Calculate points using Scrabble values + length bonus
                        const wordItem = new WordItem(wordData.word, wordData.definition, points);
                        this.score.addWord(wordItem);
                        
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
            menu: this.menu,
            finalScore: this.state.score,
            game: this
        };
        
        // Play Clear Mode complete sequence (animations + return to menu)
        if (this.sequencer && this.sequencer.sequences && this.sequencer.sequences['clearModeComplete']) {
            await this.sequencer.play('clearModeComplete', context);
        } else {
            // Fallback if sequence not defined yet
            console.log('Clear Mode complete sequence not yet defined, showing menu');
            this.menu.show();
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
