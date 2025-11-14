import { CONFIG } from './config.js';
import { FeatureFlags } from './FeatureFlags.js';
import { GameState } from './GameState.js';
import { DOMCache } from './DOMCache.js';
import { AnimationController } from './AnimationController.js';
import { GridController } from './GridController.js';
import { LetterController } from './LetterController.js';
import { ScoreController } from './ScoreController.js';
import { WordResolver } from './WordResolver.js';
import { WordItem } from './WordItem.js';
import { calculateWordScore } from './ScoringUtils.js';
import { MenuController } from './MenuController.js';
import { AnimationSequencer } from './AnimationSequencer.js';
import { SEQUENCES } from './AnimationSequences.js';

/**
 * Game class - Main orchestrator that coordinates all controllers
 */
export class Game {
    constructor() {
        // Initialize core state and DOM cache
        this.state = new GameState();
        this.dom = new DOMCache();
        
        // Initialize controllers
        this.grid = new GridController(this.state, this.dom);
        this.letters = new LetterController(this.state, this.dom);
        this.animator = new AnimationController(this.dom);
        this.score = new ScoreController(this.state, this.dom);
        this.wordResolver = null; // Will be initialized asynchronously
        
        // Initialize menu controller with callbacks
        this.menu = new MenuController(
            this.dom,
            () => this.start(),           // onStart callback
            () => this.handleLogin(),     // onLogin callback
            () => this.handleMore()       // onMore callback
        );
        
        // Initialize animation sequencer with all controllers
        this.sequencer = new AnimationSequencer({
            animator: this.animator,
            menu: this.menu,
            grid: this.grid,
            letters: this.letters,
            score: this.score
        });
        
        // Load predefined sequences
        this.sequencer.loadSequences(SEQUENCES);
        
        // Flag to prevent multiple simultaneous word checks
        this.isProcessingWords = false;
    }

    async init() {
        // Load dictionary and initialize WordResolver
        console.log('Loading dictionary...');
        this.wordResolver = await WordResolver.create(this.state, this.dom);
        console.log('Dictionary loaded successfully!');
        
        // Setup grid and letters
        this.grid.generate();
        this.letters.initialize();
        
        // Load debug grid if enabled (for testing word detection)
        if (FeatureFlags.isEnabled('debug.enabled') && FeatureFlags.isEnabled('debug.gridPattern')) {
            this.grid.loadDebugGrid();
        }
        
        // Create shared context for sequence execution
        const context = {
            dictionary: this.wordResolver.dictionary,
            state: this.state,
            dom: this.dom,
            score: this.score
        };
        
        // Play appropriate intro sequence based on debug mode
        if (FeatureFlags.isEnabled('debug.enabled')) {
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
    }

    async start() {
        this.state.started = true;
        this.dom.startBtn.textContent = '🔄';
        
        // Create context for game start sequence
        const context = {
            noodelItem: this.noodelItem,
            state: this.state,
            dom: this.dom,
            score: this.score
        };
        
        // Play game start sequence
        await this.sequencer.play('gameStart', context);
        
        // Clear noodelItem reference after it's been added
        this.noodelItem = null;
        
        // Add click handlers to grid squares
        this.grid.addClickHandlers((e) => this.handleSquareClick(e));
    }

    handleLogin() {
        console.log('Login button clicked');
        alert('Login feature coming soon!');
    }

    handleMore() {
        console.log('More button clicked');
        const choice = confirm('More options:\n\nWould you like to reset the game?');
        if (choice && this.menu) {
            this.menu.hide();
            this.reset();
        }
    }

    async reset() {
        // Reset game state (score, letters, grid data)
        this.state.reset();
        
        // Clear and regenerate the grid
        this.dom.grid.innerHTML = '';
        this.grid.generate();
        
        // Generate new letter sequence
        this.letters.initialize();
        
        // Reset progress bar to 100%
        this.animator.updateLetterProgress(
            CONFIG.GAME.INITIAL_LETTERS,
            CONFIG.GAME.INITIAL_LETTERS
        );
        
        // Clear preview tiles
        this.menu.clearPreviewTiles();
        
        // Hide preview row and change button back to start
        this.dom.preview.classList.remove('visible');
        this.dom.startBtn.textContent = '🎮';
        
        // Play reset sequence (menu flip + title shake in parallel)
        await this.sequencer.play('reset');
    }

    handleSquareClick(e) {
        // Don't process clicks when menu is active
        if (this.menu && this.menu.isActive()) return;
        
        if (!this.state.started) return;
        
        const column = parseInt(e.target.dataset.column);
        
        // Validate column
        if (isNaN(column) || column < 0 || column >= CONFIG.GRID.COLUMNS) {
            console.error('Invalid column:', column);
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
            if (FeatureFlags.isEnabled('wordDetection')) {
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
                const shouldAnimate = FeatureFlags.isEnabled('animations.wordHighlight');
                
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
                    });
                    
                    // Clear all word cells after animation
                    foundWords.forEach(wordData => {
                        this.animator.clearWordCells(wordData.positions);
                    });
                    
                    // Wait a bit before applying gravity (if animation was shown)
                    if (shouldAnimate) {
                        await new Promise(resolve => 
                            setTimeout(resolve, CONFIG.ANIMATION.WORD_CLEAR_DELAY)
                        );
                    }
                    
                    // Apply gravity to drop letters down (creates new game state) - if enabled
                    if (FeatureFlags.isEnabled('gravityPhysics')) {
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
}
