document.addEventListener('DOMContentLoaded', function() {
    const gameGrid = document.getElementById('gameGrid');
    const letterBlocks = document.querySelectorAll('.letter-block');
    const wordsList = document.getElementById('wordsList');

    // Track column fill levels (0-6 per column)
    const columnFills = new Array(7).fill(0);

    // Animation lock to prevent concurrent drops
    let animLock = false;

    // Letter cycling
    let currentLetterIndex = 0;

    // Set initial next letters preview
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 1; i <= 4; i++) {
        const letterBlock = document.getElementById(`nextLetter${i}`);
        if (letterBlock) {
            letterBlock.textContent = letters[(currentLetterIndex + i - 1) % letters.length];
        }
    }

    // Generate grid squares and make them clickable
    const gridSquares = [];
    for (let row = 0; row < 6; row++) {
        gridSquares[row] = [];
        for (let col = 0; col < 7; col++) {
            const square = document.createElement('div');
            square.className = 'grid-square';
            square.dataset.row = row;
            square.dataset.col = col;
            square.addEventListener('click', () => handleSquareClick(col));
            gridSquares[row][col] = square;
            gameGrid.appendChild(square);
        }
    }

    // Set random delays for initial grid drop animation
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
            gridSquares[row][col].style.animationDelay = `${delays[row][col]}s`;
        }
    }

    function handleSquareClick(col) {
        // Prevent drops if animation is running or column is full
        if (animLock || columnFills[col] >= 6) {
            return;
        }

        animLock = true;

        const nextLetter = document.getElementById('nextLetter1').textContent;
        const nextLetterBlock = document.getElementById('nextLetter1');

        // Stage A: Create floating copy and animate to column top
        const floatingCopy = nextLetterBlock.cloneNode(true);
        floatingCopy.classList.add('floating-copy');
        floatingCopy.classList.remove('next-up', 'shifting-slide');
        floatingCopy.textContent = nextLetter;
        document.body.appendChild(floatingCopy);

        const nextLetterRect = nextLetterBlock.getBoundingClientRect();
        const columnTopSquare = gridSquares[0][col];
        const columnTopRect = columnTopSquare.getBoundingClientRect();

        floatingCopy.style.left = `${nextLetterRect.left}px`;
        floatingCopy.style.top = `${nextLetterRect.top}px`;
        floatingCopy.style.width = `${nextLetterRect.width}px`;
        floatingCopy.style.height = `${nextLetterRect.height}px`;

        // Trigger zoom animation
        setTimeout(() => {
            floatingCopy.style.left = `${columnTopRect.left}px`;
            floatingCopy.style.top = `${columnTopRect.top}px`;
            floatingCopy.style.width = `${columnTopRect.width}px`;
            floatingCopy.style.height = `${columnTopRect.height}px`;
        }, 10);

        // Concurrently update queue
        updateQueue();

        // Stage B: After zoom, create dropping piece
        setTimeout(() => {
            floatingCopy.remove();

            const droppingPiece = document.createElement('div');
            droppingPiece.className = 'preview-letter-block dropping-piece';
            droppingPiece.textContent = nextLetter;
            gameGrid.appendChild(droppingPiece);

            const dropRow = 5 - columnFills[col];
            const dropSquare = gridSquares[dropRow][col];
            const dropRect = dropSquare.getBoundingClientRect();
            const gridRect = gameGrid.getBoundingClientRect();

            // Position at column top (relative to grid)
            droppingPiece.style.left = `${columnTopRect.left - gridRect.left}px`;
            droppingPiece.style.top = `${columnTopRect.top - gridRect.top}px`;
            droppingPiece.style.width = `${columnTopRect.width}px`;
            droppingPiece.style.height = `${columnTopRect.height}px`;

            // Trigger drop animation
            setTimeout(() => {
                droppingPiece.style.left = `${dropRect.left - gridRect.left}px`;
                droppingPiece.style.top = `${dropRect.top - gridRect.top}px`;
            }, 10);

            // After drop completes, fill the cell
            setTimeout(() => {
                droppingPiece.remove();
                dropSquare.classList.add('cell-filled');
                dropSquare.textContent = nextLetter;
                columnFills[col]++;

                // Mark column as full if needed
                if (columnFills[col] >= 6) {
                    gridSquares.forEach(row => row[col].classList.add('column-full'));
                }

                animLock = false;
            }, 800);
        }, 300);
    }

    function updateQueue() {
        // Advance letter index
        currentLetterIndex = (currentLetterIndex + 1) % letters.length;

        // Shift letters left with animation
        const queueBlocks = [
            document.getElementById('nextLetter1'),
            document.getElementById('nextLetter2'),
            document.getElementById('nextLetter3'),
            document.getElementById('nextLetter4')
        ];

        // Add shifting animation
        queueBlocks.forEach(block => block.classList.add('shifting-slide'));

        setTimeout(() => {
            // Update letter content
            for (let i = 0; i < 4; i++) {
                queueBlocks[i].textContent = letters[(currentLetterIndex + i) % letters.length];
            }

            // Remove shifting animation
            queueBlocks.forEach(block => block.classList.remove('shifting-slide'));
        }, 300);
    }

    // Set letter rotations and delays for title
    letterBlocks.forEach((block, index) => {
        const rotation = index % 2 === 0 ? '-2deg' : '2deg';
        block.style.setProperty('--rotation', rotation);
        block.style.animationDelay = `${2.0 + index * 0.1}s`;
    });

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