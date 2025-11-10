document.addEventListener('DOMContentLoaded', () => {
    const gameGrid = document.getElementById('gameGrid');
    const wordsList = document.getElementById('wordsList');
    const lettersRemainingEl = document.getElementById('letters-remaining');
    const nextLettersPreview = document.querySelector('.next-letters-preview');
    const letterBlocks = document.querySelectorAll('.title .letter-block');
    const startBtn = document.querySelector('.start-btn');

    const COLS = 7;
    const ROWS = 6;
    let columnFills = new Array(COLS).fill(0);
    let lettersRemaining = 100;
    let gameStarted = false;

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
    let letterQueue = [];

    function generateInitialQueue() {
        letterQueue = [];
        for (let i = 0; i < 4; i++) {
            letterQueue.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
        }
        renderNextLetters();
    }

    function advanceQueue() {
        letterQueue.shift();
        letterQueue.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
        renderNextLetters();
        lettersRemaining--;
        lettersRemainingEl.textContent = lettersRemaining;
    }

    function renderNextLetters() {
        nextLettersPreview.innerHTML = '';
        letterQueue.forEach((letter, index) => {
            const letterDiv = document.createElement('div');
            letterDiv.className = 'preview-letter-block';
            letterDiv.textContent = letter;
            if (index === 0) {
                letterDiv.classList.add('next-up');
            }
            nextLettersPreview.appendChild(letterDiv);
        });
    }

    // 1. Grid Generation
    function generateGrid() {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const square = document.createElement('div');
                square.className = 'grid-square';
                square.dataset.col = col;
                square.dataset.row = row;
                square.addEventListener('click', () => handleColumnClick(col));
                gameGrid.appendChild(square);
            }
        }
    }

    // 2. Title Animation
    function animateTitle() {
        letterBlocks.forEach((block, index) => {
            block.style.animation = `dropIn 0.6s ease-out ${2.0 + index * 0.1}s forwards`;
        });

        setTimeout(() => {
            letterBlocks.forEach(block => {
                block.style.background = '#4CAF50';
                block.classList.add('shaking');
            });
        }, 2900);
    }

    // 3. Initial Word Addition
    function addInitialWord() {
        setTimeout(() => {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';
            wordItem.innerHTML = '<strong>NOODEL</strong> <small>(The game itself!)</small>';
            wordsList.appendChild(wordItem);
        }, 3200);
    }

    // 4. Handle Column Click and Drop Animation
    function handleColumnClick(colIndex) {
        if (!gameStarted || columnFills[colIndex] >= ROWS) {
            return; // Column is full or game not started
        }

        const letterToDrop = letterQueue[0];
        const targetRow = ROWS - 1 - columnFills[colIndex];
        
        dropLetterInColumn(colIndex, targetRow, letterToDrop);
        
        columnFills[colIndex]++;
        advanceQueue();
    }

    function dropLetterInColumn(col, row, letter) {
        const nextUpElement = document.querySelector('.next-up');
        if (!nextUpElement) return;

        const startRect = nextUpElement.getBoundingClientRect();
        const topRowSquare = document.querySelector(`.grid-square[data-col='${col}'][data-row='0']`);
        const endSquare = document.querySelector(`.grid-square[data-col='${col}'][data-row='${row}']`);
        
        if (!topRowSquare || !endSquare) return;

        const topRect = topRowSquare.getBoundingClientRect();
        const endRect = endSquare.getBoundingClientRect();

        const overlay = document.createElement('div');
        overlay.className = 'dropping-letter-overlay';
        overlay.textContent = letter;
        
        // Initial position at next-up
        overlay.style.left = `${startRect.left}px`;
        overlay.style.top = `${startRect.top}px`;
        overlay.style.width = `${startRect.width}px`;
        overlay.style.height = `${startRect.height}px`;
        
        document.body.appendChild(overlay);

        // Stage 1: Move to top of column
        requestAnimationFrame(() => {
            overlay.style.left = `${topRect.left}px`;
            overlay.style.top = `${topRect.top}px`;
            overlay.style.width = `${topRect.width}px`;
            overlay.style.height = `${topRect.height}px`;
        });

        // Stage 2: Drop down
        setTimeout(() => {
            overlay.classList.add('animating');
            overlay.style.top = `${endRect.top}px`;
        }, 300); // after 0.3s transition

        // Stage 3: Settle
        setTimeout(() => {
            endSquare.textContent = letter;
            endSquare.classList.add('filled');
            document.body.removeChild(overlay);
            // Here you would check for words
        }, 800); // 0.3s + 0.5s
    }

    function resetGame() {
        gameGrid.innerHTML = '';
        generateGrid();
        columnFills.fill(0);
        lettersRemaining = 100;
        lettersRemainingEl.textContent = lettersRemaining;
        wordsList.innerHTML = '';
        addInitialWord();
        generateInitialQueue();
        nextLettersPreview.style.display = 'flex';
        gameStarted = true;
    }

    startBtn.addEventListener('click', () => {
        if (!gameStarted) {
            resetGame();
            startBtn.textContent = '🔄 RESET';
        } else {
            resetGame();
        }
    });

    // Initialize
    generateGrid();
    animateTitle();
    addInitialWord();
    // generateInitialQueue(); // Don't generate queue until game starts
});
