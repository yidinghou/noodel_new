document.addEventListener('DOMContentLoaded', function() {
    const gameGrid = document.getElementById('gameGrid');
    const letterBlocks = document.querySelectorAll('.letter-block');
    const wordsList = document.getElementById('wordsList');
    const shiftBtn = document.getElementById('shiftBtn');

    // Set initial next letters preview (4 random letters)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 1; i <= 4; i++) {
        const letterBlock = document.getElementById(`nextLetter${i}`);
        if (letterBlock) {
            letterBlock.textContent = letters[Math.floor(Math.random() * letters.length)];
        }
    }

    // Shift letters on button click with slide visual cue
    shiftBtn.addEventListener('click', () => {
        // Add shifting class
        document.querySelectorAll('.preview-letter-block').forEach(block => block.classList.add('shifting-slide'));

        setTimeout(() => {
            const currentLetters = [];
            for (let i = 1; i <= 4; i++) {
                currentLetters.push(document.getElementById(`nextLetter${i}`).textContent);
            }
            // Shift left
            for (let i = 1; i < 4; i++) {
                document.getElementById(`nextLetter${i}`).textContent = currentLetters[i];
            }
            // New letter on the right
            document.getElementById('nextLetter4').textContent = letters[Math.floor(Math.random() * letters.length)];

            // Remove shifting class
            document.querySelectorAll('.preview-letter-block').forEach(block => block.classList.remove('shifting-slide'));
        }, 300);
    });

    // Set letter rotations and delays
    letterBlocks.forEach((block, index) => {
        const rotation = index % 2 === 0 ? '-2deg' : '2deg';
        block.style.setProperty('--rotation', rotation);
        block.style.animationDelay = `${2.0 + index * 0.1}s`;
    });

    // Generate grid squares with random column selection delays
    const delays = Array.from({ length: 6 }, () => Array(7).fill(null));
    let currentDelay = 0.1;
    const increment = 0.05;

    while (true) {
        const availableColumns = [];
        for (let col = 0; col < 7; col++) {
            if (delays.some(row => row[col] === null)) {
                availableColumns.push(col);
            }
        }
        if (availableColumns.length === 0) break;

        const randomColIndex = Math.floor(Math.random() * availableColumns.length);
        const col = availableColumns[randomColIndex];

        // Find the lowest available row (highest index)
        let row = 5;
        while (row >= 0 && delays[row][col] !== null) {
            row--;
        }
        if (row >= 0) {
            delays[row][col] = currentDelay;
            currentDelay += increment;
        }
    }

    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            const square = document.createElement('div');
            square.className = 'grid-square';
            square.style.animationDelay = `${delays[row][col]}s`;
            gameGrid.appendChild(square);
        }
    }

    // Color change and shake after letters drop
    setTimeout(() => {
        letterBlocks.forEach(block => {
            block.style.backgroundColor = '#4CAF50';
            block.style.animation = 'shake 0.4s forwards';
        });
    }, 2900);

    // Add NOODEL to words list
    setTimeout(() => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.innerHTML = '<strong>NOODEL</strong> <small>Starting word</small>';
        wordsList.appendChild(wordItem);
    }, 3200);
});