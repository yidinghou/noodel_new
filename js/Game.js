import { CONFIG } from './config.js';
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
        if (CONFIG.DEBUG && CONFIG.DEBUG_GRID_ENABLED) {
            this.grid.loadDebugGrid();
        }
        
        if (CONFIG.DEBUG) {
            // DEBUG mode: Skip animations and show UI immediately
            await this.commonSetup();
            this.dom.stats.classList.add('visible');
            // Show menu after a short delay
            setTimeout(() => this.menu.show(), 300);
        } else {
            // Normal mode: Run NOODEL falling animation first
            await this.animator.randomizeTitleLetterAnimations();
            
            // Shake NOODEL title
            await this.animator.shakeAllTitleLetters();
            
            // Create NOODEL word item
            const noodelDef = this.wordResolver.dictionary.get('NOODEL') || 'Click Grid, Drop Letters, Make Words.';
            const noodelScore = calculateWordScore('NOODEL');
            const noodelItem = new WordItem('NOODEL', noodelDef, noodelScore);
            
            // Animate word dropping from above stats to made words section
            await this.animator.animateNoodelWordDrop(noodelItem, () => {
                this.score.addWord(noodelItem);
            });
            
            // Show menu after stats appear (stats fade in during word drop)
            setTimeout(() => this.menu.show(), 400);
        }
        
        // Setup event listeners
        this.setupEventListeners();
    }

    // Common setup for both init and reset - shakes NOODEL and adds word
    async commonSetup() {
        // Shake NOODEL title letters
        await this.animator.shakeAllTitleLetters();
        
        // Add NOODEL word to made words list
        const noodelDef = this.wordResolver.dictionary.get('NOODEL') || 'Click Grid, Drop Letters, Make Words.';
        const noodelScore = calculateWordScore('NOODEL'); // Calculate using Scrabble values + length bonus
        const noodelItem = new WordItem('NOODEL', noodelDef, noodelScore);
        this.score.addWord(noodelItem);
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

    start() {
        this.state.started = true;
        this.dom.startBtn.textContent = '🔄';
        
        // Hide menu if it's active
        if (this.menu && this.menu.isActive()) {
            this.menu.hide();
        }
        
        // Show next letters preview
        this.dom.preview.classList.add('visible');
        this.letters.display();
        
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
        
        // Clear words list and reset score controller
        this.dom.wordsList.innerHTML = '';
        this.score.madeWords = [];
        
        // Update UI displays
        this.dom.scoreValue.textContent = this.state.score;
        this.dom.lettersRemaining.textContent = this.state.lettersRemaining;
        
        // Generate new letter sequence
        this.letters.initialize();
        
        // Hide preview and reset button
        this.dom.preview.classList.remove('visible');
        this.dom.startBtn.textContent = '🎮';
        
        // Shake NOODEL title AND flip menu in simultaneously
        if (this.menu) {
            this.menu.show(true); // Pass true to use flip animation
        }
        
        // Then shake title and add NOODEL word
        await this.animator.shakeAllTitleLetters();
        
        // Add NOODEL word to made words list
        const noodelDef = this.wordResolver.dictionary.get('NOODEL') || 'Click Grid, Drop Letters, Make Words.';
        const noodelScore = calculateWordScore('NOODEL');
        const noodelItem = new WordItem('NOODEL', noodelDef, noodelScore);
        this.score.addWord(noodelItem);
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
            
            // Check for words after the letter has been placed
            await this.checkAndProcessWords();
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
                
                if (foundWords.length > 0) {
                    // Animate all words in this game state SIMULTANEOUSLY
                    const animationPromises = foundWords.map(wordData => 
                        this.animator.highlightAndShakeWord(wordData.positions)
                    );
                    
                    // Wait for all animations to complete together
                    await Promise.all(animationPromises);
                    
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
                    
                    // Wait a bit before applying gravity
                    await new Promise(resolve => 
                        setTimeout(resolve, CONFIG.ANIMATION.WORD_CLEAR_DELAY)
                    );
                    
                    // Apply gravity to drop letters down (creates new game state)
                    this.grid.applyGravity();
                    
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
