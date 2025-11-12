import { CONFIG } from './config.js';
import { GameState } from './GameState.js';
import { DOMCache } from './DOMCache.js';
import { AnimationController } from './AnimationController.js';
import { GridController } from './GridController.js';
import { LetterController } from './LetterController.js';
import { ScoreController } from './ScoreController.js';

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
    }

    async init() {
        // Setup grid and letters
        this.grid.generate();
        this.letters.initialize();
        
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
        this.animator.dropLetterInColumn(column, nextLetter, targetRow, () => {
            // Update game state after animation completes
            this.state.incrementColumnFill(column);
            this.letters.advance();
            this.score.updateLettersRemaining();
        });
    }
}
