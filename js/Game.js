import { CONFIG } from './config.js';
import { GameState } from './GameState.js';
import { DOMCache } from './DOMCache.js';
import { AnimationController } from './AnimationController.js';
import { GridController } from './GridController.js';
import { LetterController } from './LetterController.js';
import { ScoreController } from './ScoreController.js';
import { WordResolver } from './WordResolver.js';

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
        this.wordResolver = new WordResolver(this.state, this.dom);
        
        // Flag to prevent multiple simultaneous word checks
        this.isProcessingWords = false;
    }

    async init() {
        // Setup grid and letters
        this.grid.generate();
        this.letters.initialize();
        
        // Load debug grid if enabled (for testing word detection)
        if (CONFIG.DEBUG && CONFIG.DEBUG_GRID_ENABLED) {
            this.grid.loadDebugGrid();
        }
        
        if (CONFIG.DEBUG) {
            // DEBUG mode: Skip animations and show UI immediately
            this.score.addWord('NOODEL', 'The name of this game!');
            this.dom.controls.classList.add('visible');
            this.dom.stats.classList.add('visible');
        } else {
            // Normal mode: Run initial animations
            await this.animator.randomizeTitleLetterAnimations();
            await this.animator.shakeAllTitleLetters();
            
            // Add initial word and show UI
            this.score.addWord('NOODEL', 'The name of this game!');
            this.animator.showControlsAndStats();
        }
        
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

    start() {
        this.state.started = true;
        this.dom.startBtn.textContent = '🔄 RESET';
        
        // Show next letters preview
        this.dom.preview.classList.add('visible');
        this.letters.display();
        
        // Add click handlers to grid squares
        this.grid.addClickHandlers((e) => this.handleSquareClick(e));
    }

    reset() {
        location.reload();
    }

    handleSquareClick(e) {
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
                        this.score.addWord(
                            wordData.word,
                            `${wordData.direction} - ${wordData.word.length} letters`
                        );
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
