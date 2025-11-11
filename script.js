// Game state
let gameStarted = false;
let currentLetterIndex = 0;
let lettersRemaining = 100;
let score = 0;
let columnFillCounts = [0, 0, 0, 0, 0, 0, 0]; // Track how many cells are filled in each column
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
let nextLetters = [];

// Randomize NOODEL title letter animation delays
function randomizeTitleLetterAnimations() {
    return new Promise((resolve) => {
        const letterBlocks = document.querySelectorAll('.letter-block');
        const interval = 0.25; // Regular interval between drops (0.25s)
        
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
        const dropDuration = 0.6; // 0.6s from CSS dropIn animation
        const lastDropEnd = (maxDelay + dropDuration) * 1000; // Convert to ms
        
        // Resolve promise when animation completes
        setTimeout(resolve, lastDropEnd);
    });
}

// Apply color change and shake to all title letters simultaneously
function shakeAllTitleLetters() {
    return new Promise((resolve) => {
        const letterBlocks = document.querySelectorAll('.letter-block');
        const shakeDuration = 400; // 0.4s from CSS shake animation
        
        // Change all letters to green and trigger shake at the same time
        letterBlocks.forEach(block => {
            block.style.backgroundColor = '#4CAF50';
            block.style.animationDelay = '0s'; // Reset delay so all shake together
            block.classList.add('shaking');
        });
        
        // Resolve promise when shake completes
        setTimeout(resolve, shakeDuration);
    });
}

// Show controls and stats after NOODEL animation completes
function showControlsAndStats() {
    const controls = document.querySelector('.controls');
    const stats = document.querySelector('.stats');
    
    // Show controls after a short delay
    setTimeout(() => {
        controls.classList.add('visible');
    }, 200);
    
    // Show stats shortly after controls
    setTimeout(() => {
        stats.classList.add('visible');
    }, 500);
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    generateGrid();
    initializeNextLetters();
    
    // Chain animations in sequence
    randomizeTitleLetterAnimations()
        .then(() => shakeAllTitleLetters())
        .then(() => {
            addWord('NOODEL', 'The name of this game!');
            showControlsAndStats();
        });
    
    // Start button functionality
    const startBtn = document.getElementById('startBtn');
    startBtn.addEventListener('click', () => {
        if (!gameStarted) {
            startGame();
        } else {
            resetGame();
        }
    });
    
    // Mute button functionality
    const muteBtn = document.getElementById('muteBtn');
    muteBtn.addEventListener('click', () => {
        // Toggle mute state
        muteBtn.textContent = muteBtn.textContent === '🔊' ? '🔇' : '🔊';
    });
});

// Generate the 7x6 grid
function generateGrid() {
    const gridElement = document.getElementById('gameGrid');
    
    for (let i = 0; i < 42; i++) {
        const square = document.createElement('div');
        square.className = 'grid-square';
        square.dataset.index = i;
        square.dataset.column = i % 7;
        square.dataset.row = Math.floor(i / 7);
        gridElement.appendChild(square);
    }
}

// Initialize next letters
function initializeNextLetters() {
    nextLetters = [];
    for (let i = 0; i < 4; i++) {
        nextLetters.push(alphabet[currentLetterIndex % 26]);
        currentLetterIndex++;
    }
}

// Display next letters preview
function displayNextLetters() {
    const preview = document.getElementById('nextLettersPreview');
    preview.innerHTML = '';
    
    nextLetters.forEach((letter, index) => {
        const letterBlock = document.createElement('div');
        letterBlock.className = 'preview-letter-block';
        if (index === 0) {
            letterBlock.classList.add('next-up');
        }
        letterBlock.textContent = letter;
        preview.appendChild(letterBlock);
    });
}

// Start the game
function startGame() {
    gameStarted = true;
    document.getElementById('startBtn').textContent = '🔄 RESET';
    
    // Show next letters preview
    const preview = document.getElementById('nextLettersPreview');
    preview.classList.add('visible');
    displayNextLetters();
    
    // Add click handlers to grid squares
    const squares = document.querySelectorAll('.grid-square');
    squares.forEach(square => {
        square.addEventListener('click', handleSquareClick);
    });
}

// Reset the game
function resetGame() {
    location.reload();
}

// Handle grid square click
function handleSquareClick(e) {
    if (!gameStarted) return;
    
    const column = parseInt(e.target.dataset.column);
    
    // Check if column is full
    if (columnFillCounts[column] >= 6) return;
    
    // Drop the next letter
    dropLetterInColumn(column);
}

// Drop letter in column with three-stage animation
function dropLetterInColumn(column) {
    const nextLetter = nextLetters[0];
    
    // Get the next-up letter block position
    const nextUpBlock = document.querySelector('.preview-letter-block.next-up');
    const nextUpRect = nextUpBlock.getBoundingClientRect();
    
    // Calculate target position (lowest available row in column)
    const targetRow = 5 - columnFillCounts[column];
    const targetIndex = targetRow * 7 + column;
    const targetSquare = document.querySelector(`.grid-square[data-index="${targetIndex}"]`);
    const targetRect = targetSquare.getBoundingClientRect();
    
    // Get top row position in the column
    const topRowIndex = column;
    const topRowSquare = document.querySelector(`.grid-square[data-index="${topRowIndex}"]`);
    const topRowRect = topRowSquare.getBoundingClientRect();
    
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'dropping-letter-overlay';
    overlay.textContent = nextLetter;
    
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
    
    // Stage 2: Drop to target position (0.5s after 0.3s)
    setTimeout(() => {
        overlay.classList.add('animating');
        overlay.style.top = `${targetRect.top}px`;
    }, 300);
    
    // Stage 3: Settlement (after total 0.8s)
    setTimeout(() => {
        targetSquare.textContent = nextLetter;
        targetSquare.classList.add('filled');
        document.body.removeChild(overlay);
        
        // Update game state
        columnFillCounts[column]++;
        advanceToNextLetter();
        updateLettersRemaining();
    }, 800);
}

// Advance to next letter in sequence
function advanceToNextLetter() {
    // Remove first letter and add new one at the end
    nextLetters.shift();
    nextLetters.push(alphabet[currentLetterIndex % 26]);
    currentLetterIndex++;
    
    // Update display
    displayNextLetters();
}

// Update letters remaining counter
function updateLettersRemaining() {
    lettersRemaining--;
    document.getElementById('lettersRemaining').textContent = lettersRemaining;
    
    if (lettersRemaining === 0) {
        // Game over logic
        alert('Game Over! No more letters remaining.');
    }
}

// Add word to the words list
function addWord(word, description) {
    const wordsList = document.getElementById('wordsList');
    const wordItem = document.createElement('div');
    wordItem.className = 'word-item';
    wordItem.innerHTML = `<strong>${word}</strong> <small>${description}</small>`;
    wordsList.appendChild(wordItem);
    
    // Update score
    score += word.length;
    document.getElementById('scoreValue').textContent = score;
}
