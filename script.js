// Configuration constants
const CONFIG = {
    GRID: {
        ROWS: 6,
        COLUMNS: 7,
        TOTAL_CELLS: 42
    },
    GAME: {
        INITIAL_LETTERS: 100,
        PREVIEW_COUNT: 4,
        ALPHABET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    },
    ANIMATION: {
        TITLE_DROP_INTERVAL: 0.25,      // seconds between each title letter drop
        TITLE_DROP_DURATION: 0.6,       // duration of title letter drop animation
        TITLE_SHAKE_DURATION: 400,      // milliseconds for shake animation
        CONTROLS_DELAY: 200,             // milliseconds before showing controls
        STATS_DELAY: 500,                // milliseconds before showing stats
        LETTER_STAGE_1_DELAY: 300,      // milliseconds for stage 1 (move to top)
        LETTER_STAGE_2_DELAY: 800,      // milliseconds for stage 2+3 (drop + settle)
        LETTER_DROP_START: 300          // milliseconds before starting drop
    },
    COLORS: {
        TITLE_ACTIVE: '#4CAF50'
    }
};

// ===========================
// GAME STATE CLASS
// ===========================
class GameState {
    constructor() {
        this.started = false;
        this.currentLetterIndex = 0;
        this.lettersRemaining = CONFIG.GAME.INITIAL_LETTERS;
        this.score = 0;
        this.columnFillCounts = Array(CONFIG.GRID.COLUMNS).fill(0);
        this.nextLetters = [];
        this.alphabet = CONFIG.GAME.ALPHABET;
    }

    reset() {
        this.started = false;
        this.currentLetterIndex = 0;
        this.lettersRemaining = CONFIG.GAME.INITIAL_LETTERS;
        this.score = 0;
        this.columnFillCounts = Array(CONFIG.GRID.COLUMNS).fill(0);
        this.nextLetters = [];
    }

    isColumnFull(column) {
        return this.columnFillCounts[column] >= CONFIG.GRID.ROWS;
    }

    getLowestAvailableRow(column) {
        return CONFIG.GRID.ROWS - 1 - this.columnFillCounts[column];
    }

    incrementColumnFill(column) {
        this.columnFillCounts[column]++;
    }

    decrementLettersRemaining() {
        this.lettersRemaining--;
    }

    addToScore(points) {
        this.score += points;
    }

    isGameOver() {
        return this.lettersRemaining <= 0;
    }
}

// Game state instance
const gameState = new GameState();

// ===========================
// DOM CACHE CLASS
// ===========================
class DOMCache {
    constructor() {
        this.grid = document.getElementById('gameGrid');
        this.startBtn = document.getElementById('startBtn');
        this.muteBtn = document.getElementById('muteBtn');
        this.preview = document.getElementById('nextLettersPreview');
        this.wordsList = document.getElementById('wordsList');
        this.scoreValue = document.getElementById('scoreValue');
        this.lettersRemaining = document.getElementById('lettersRemaining');
        this.controls = document.querySelector('.controls');
        this.stats = document.querySelector('.stats');
    }

    getAllGridSquares() {
        return document.querySelectorAll('.grid-square');
    }

    getGridSquare(index) {
        return document.querySelector(`.grid-square[data-index="${index}"]`);
    }

    getTitleLetterBlocks() {
        return document.querySelectorAll('.letter-block');
    }

    getNextUpBlock() {
        return document.querySelector('.preview-letter-block.next-up');
    }
}

// DOM cache instance
const dom = new DOMCache();

// ===========================
// ANIMATION CONTROLLER CLASS
// ===========================
class AnimationController {
    constructor(domCache) {
        this.dom = domCache;
    }

    // Randomize NOODEL title letter animation delays
    randomizeTitleLetterAnimations() {
        return new Promise((resolve) => {
            const letterBlocks = this.dom.getTitleLetterBlocks();
            const interval = CONFIG.ANIMATION.TITLE_DROP_INTERVAL;
            
            // Create array of indices and shuffle it
            const indices = Array.from({ length: letterBlocks.length }, (_, i) => i);
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            
            // Assign delays based on shuffled order
            indices.forEach((originalIndex, dropOrder) => {
                const delay = dropOrder * interval;
                letterBlocks[originalIndex].style.animationDelay = `${delay}s`;
            });
            
            // Find the latest animation end time
            const maxDelay = (letterBlocks.length - 1) * interval;
            const dropDuration = CONFIG.ANIMATION.TITLE_DROP_DURATION;
            const lastDropEnd = (maxDelay + dropDuration) * 1000; // Convert to ms
            
            // Resolve promise when animation completes
            setTimeout(resolve, lastDropEnd);
        });
    }

    // Apply color change and shake to all title letters simultaneously
    shakeAllTitleLetters() {
        return new Promise((resolve) => {
            const letterBlocks = this.dom.getTitleLetterBlocks();
            
            // Change all letters to green and trigger shake at the same time
            letterBlocks.forEach(block => {
                block.style.backgroundColor = CONFIG.COLORS.TITLE_ACTIVE;
                block.style.animationDelay = '0s'; // Reset delay so all shake together
                block.classList.add('shaking');
            });
            
            // Resolve promise when shake completes
            setTimeout(resolve, CONFIG.ANIMATION.TITLE_SHAKE_DURATION);
        });
    }

    // Show controls and stats after NOODEL animation completes
    showControlsAndStats() {
        // Show controls after a short delay
        setTimeout(() => {
            this.dom.controls.classList.add('visible');
        }, CONFIG.ANIMATION.CONTROLS_DELAY);
        
        // Show stats shortly after controls
        setTimeout(() => {
            this.dom.stats.classList.add('visible');
        }, CONFIG.ANIMATION.STATS_DELAY);
    }

    // Drop letter in column with three-stage animation
    dropLetterInColumn(column, letter, targetRow, onComplete) {
        // Get the next-up letter block position
        const nextUpBlock = this.dom.getNextUpBlock();
        const nextUpRect = nextUpBlock.getBoundingClientRect();
        
        // Calculate target position
        const targetIndex = targetRow * CONFIG.GRID.COLUMNS + column;
        const targetSquare = this.dom.getGridSquare(targetIndex);
        const targetRect = targetSquare.getBoundingClientRect();
        
        // Get top row position in the column
        const topRowIndex = column;
        const topRowSquare = this.dom.getGridSquare(topRowIndex);
        const topRowRect = topRowSquare.getBoundingClientRect();
        
        // Create overlay element
        const overlay = document.createElement('div');
        overlay.className = 'dropping-letter-overlay';
        overlay.textContent = letter;
        
        // Set initial position to match next-up block
        overlay.style.left = `${nextUpRect.left}px`;
        overlay.style.top = `${nextUpRect.top}px`;
        overlay.style.width = `${nextUpRect.width}px`;
        overlay.style.height = `${nextUpRect.height}px`;
        
        document.body.appendChild(overlay);
        
        // Force reflow
        overlay.offsetHeight;
        
        // Stage 1: Move to top of column (0.3s)
        overlay.style.left = `${topRowRect.left}px`;
        overlay.style.top = `${topRowRect.top}px`;
        overlay.style.width = `${topRowRect.width}px`;
        overlay.style.height = `${topRowRect.height}px`;
        
        // Stage 2: Drop to target position
        setTimeout(() => {
            overlay.classList.add('animating');
            overlay.style.top = `${targetRect.top}px`;
        }, CONFIG.ANIMATION.LETTER_DROP_START);
        
        // Stage 3: Settlement
        setTimeout(() => {
            targetSquare.textContent = letter;
            targetSquare.classList.add('filled');
            document.body.removeChild(overlay);
            
            // Call completion callback
            if (onComplete) {
                onComplete();
            }
        }, CONFIG.ANIMATION.LETTER_STAGE_2_DELAY);
    }
}

// ===========================
// GRID CONTROLLER CLASS
// ===========================
class GridController {
    constructor(gameState, domCache) {
        this.gameState = gameState;
        this.dom = domCache;
    }

    // Generate the grid
    generate() {
        for (let i = 0; i < CONFIG.GRID.TOTAL_CELLS; i++) {
            const square = document.createElement('div');
            square.className = 'grid-square';
            square.dataset.index = i;
            square.dataset.column = i % CONFIG.GRID.COLUMNS;
            square.dataset.row = Math.floor(i / CONFIG.GRID.COLUMNS);
            this.dom.grid.appendChild(square);
        }
    }

    // Add click handlers to all grid squares
    addClickHandlers(handler) {
        const squares = this.dom.getAllGridSquares();
        squares.forEach(square => {
            square.addEventListener('click', handler);
        });
    }

    // Handle grid square click
    handleSquareClick(e) {
        if (!this.gameState.started) return;
        
        const column = parseInt(e.target.dataset.column);
        
        // Validate column
        if (isNaN(column) || column < 0 || column >= CONFIG.GRID.COLUMNS) {
            console.error('Invalid column:', column);
            return;
        }
        
        // Check if column is full
        if (this.gameState.isColumnFull(column)) return;
        
        // Return column to be processed by caller
        return column;
    }
}

// ===========================
// LETTER CONTROLLER CLASS
// ===========================
class LetterController {
    constructor(gameState, domCache) {
        this.gameState = gameState;
        this.dom = domCache;
    }

    // Initialize next letters
    initialize() {
        this.gameState.nextLetters = [];
        for (let i = 0; i < CONFIG.GAME.PREVIEW_COUNT; i++) {
            this.gameState.nextLetters.push(this.gameState.alphabet[this.gameState.currentLetterIndex % 26]);
            this.gameState.currentLetterIndex++;
        }
    }

    // Display next letters preview
    display() {
        this.dom.preview.innerHTML = '';
        
        this.gameState.nextLetters.forEach((letter, index) => {
            const letterBlock = document.createElement('div');
            letterBlock.className = 'preview-letter-block';
            if (index === 0) {
                letterBlock.classList.add('next-up');
            }
            letterBlock.textContent = letter;
            this.dom.preview.appendChild(letterBlock);
        });
    }

    // Advance to next letter in sequence
    advance() {
        // Remove first letter and add new one at the end
        this.gameState.nextLetters.shift();
        this.gameState.nextLetters.push(this.gameState.alphabet[this.gameState.currentLetterIndex % 26]);
        this.gameState.currentLetterIndex++;
        
        // Update display
        this.display();
    }

    // Get the next letter to be played
    getNextLetter() {
        return this.gameState.nextLetters[0];
    }
}

// ===========================
// SCORE CONTROLLER CLASS
// ===========================
class ScoreController {
    constructor(gameState, domCache) {
        this.gameState = gameState;
        this.dom = domCache;
    }

    // Add word to the words list
    addWord(word, description) {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.innerHTML = `<strong>${word}</strong> <small>${description}</small>`;
        this.dom.wordsList.appendChild(wordItem);
        
        // Update score
        this.gameState.addToScore(word.length);
        this.dom.scoreValue.textContent = this.gameState.score;
    }

    // Update letters remaining counter
    updateLettersRemaining() {
        this.gameState.decrementLettersRemaining();
        this.dom.lettersRemaining.textContent = this.gameState.lettersRemaining;
        
        if (this.gameState.isGameOver()) {
            // Game over logic
            alert('Game Over! No more letters remaining.');
        }
    }
}

// ===========================
// INITIALIZATION
// ===========================

// ===========================
// GAME ORCHESTRATOR CLASS
// ===========================
class Game {
    constructor() {
        // Initialize core state and DOM cache
        this.state = gameState;
        this.dom = dom;
        
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
        
        // Run initial animations
        await this.animator.randomizeTitleLetterAnimations();
        await this.animator.shakeAllTitleLetters();
        
        // Add initial word and show UI
        this.score.addWord('NOODEL', 'The name of this game!');
        this.animator.showControlsAndStats();
        
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

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});

