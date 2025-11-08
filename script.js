document.addEventListener('DOMContentLoaded', function() {
    const gameGrid = document.getElementById('gameGrid');
    const letterBlocks = document.querySelectorAll('.letter-block');
    const wordsList = document.getElementById('wordsList');

    // Set letter rotations and delays
    letterBlocks.forEach((block, index) => {
        const rotation = index % 2 === 0 ? '-2deg' : '2deg';
        block.style.setProperty('--rotation', rotation);
        block.style.animationDelay = `${2.0 + index * 0.1}s`;
    });

    // Generate grid squares with delays
    const columnDelays = [];
    for (let i = 0; i < 7; i++) {
        columnDelays.push(Math.random() * 1.5 + 0.1); // 0.1 to 1.6
    }

    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            const square = document.createElement('div');
            square.className = 'grid-square';
            let delay = columnDelays[col];
            if (row < 5) {
                delay -= (5 - row) * 0.1;
                delay = Math.max(delay, 0);
            }
            square.style.animationDelay = `${delay}s`;
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