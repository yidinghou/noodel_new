import { CONFIG } from './config.js';

/**
 * MenuController class - Manages the menu interface using grid-based buttons
 * Displays START, LOGIN, and MORE as clickable words in the game grid
 */
export class MenuController {
    constructor(domCache, onStart, onLogin, onMore) {
        this.dom = domCache;
        this.onStart = onStart;
        this.onLogin = onLogin;
        this.onMore = onMore;
        this.isMenuActive = false;
        
        // Define button words and their positions
        // Grid is 7 columns x 6 rows
        this.menuWords = [
            {
                word: 'START',
                row: 1,
                startCol: 1,
                className: 'menu-start'
            },
            {
                word: 'LOGIN',
                row: 3,
                startCol: 1,
                className: 'menu-login'
            },
            {
                word: 'MORE',
                row: 5,
                startCol: 1.5,
                className: 'menu-more'
            }
        ];
    }

    /**
     * Show the menu by displaying button words in the grid with drop animation
     */
    show() {
        this.isMenuActive = true;
        
        // Clear the grid first
        const squares = this.dom.getAllGridSquares();
        squares.forEach(square => {
            square.textContent = '';
            square.classList.remove('filled', 'menu-button', 'menu-start', 'menu-login', 'menu-more');
        });
        
        // Collect all menu button data (square, letter, position)
        const menuButtons = [];
        
        // Collect menu button data for each word
        this.menuWords.forEach(menuItem => {
            const buttonData = this.collectMenuButtonData(menuItem);
            menuButtons.push(...buttonData);
        });
        
        // Animate buttons dropping in with randomized order
        this.animateMenuDrop(menuButtons);
        
        // Add click handlers after animation starts
        setTimeout(() => {
            this.addMenuClickHandlers();
        }, 100);
    }

    /**
     * Collect menu button data for animation
     */
    collectMenuButtonData(menuItem) {
        const { word, row, startCol, className } = menuItem;
        const buttonData = [];
        
        for (let i = 0; i < word.length; i++) {
            const col = Math.floor(startCol + i);
            const index = row * CONFIG.GRID.COLUMNS + col;
            const square = this.dom.getGridSquare(index);
            
            if (square) {
                buttonData.push({
                    square: square,
                    letter: word[i],
                    className: className,
                    word: word.toLowerCase(),
                    index: index,
                    row: row,
                    col: col
                });
            }
        }
        
        return buttonData;
    }

    /**
     * Animate menu buttons dropping in place (similar to dropLetterInColumn)
     */
    animateMenuDrop(menuButtons) {
        // Randomize drop order
        const shuffled = [...menuButtons];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Drop each button with a delay
        const dropInterval = 80; // ms between each drop
        
        shuffled.forEach((buttonData, dropOrder) => {
            const delay = dropOrder * dropInterval;
            
            setTimeout(() => {
                this.dropMenuButton(buttonData);
            }, delay);
        });
    }

    /**
     * Drop a single menu button into place
     */
    dropMenuButton(buttonData) {
        const { square, letter, className, word } = buttonData;
        
        // Get the target square's position
        const targetRect = square.getBoundingClientRect();
        
        // Calculate starting position (above the grid)
        const startTop = targetRect.top - 300;
        
        // Create overlay element for the drop animation
        const overlay = document.createElement('div');
        overlay.className = 'dropping-letter-overlay menu-dropping';
        overlay.textContent = letter;
        
        // Set initial position above target
        overlay.style.left = `${targetRect.left}px`;
        overlay.style.top = `${startTop}px`;
        overlay.style.width = `${targetRect.width}px`;
        overlay.style.height = `${targetRect.height}px`;
        
        document.body.appendChild(overlay);
        
        // Force reflow
        overlay.offsetHeight;
        
        // Animate drop to target position
        setTimeout(() => {
            overlay.style.transition = 'top 0.4s ease-in';
            overlay.style.top = `${targetRect.top}px`;
        }, 10);
        
        // After drop completes, update the actual grid square
        setTimeout(() => {
            square.textContent = letter;
            square.classList.add('filled', 'menu-button', className);
            square.dataset.menuButton = word;
            document.body.removeChild(overlay);
        }, 420); // Slightly longer than animation duration
    }

    /**
     * Add click handlers for menu buttons
     */
    addMenuClickHandlers() {
        const squares = this.dom.getAllGridSquares();
        
        squares.forEach(square => {
            if (square.classList.contains('menu-button')) {
                square.addEventListener('click', (e) => this.handleMenuClick(e));
            }
        });
    }

    /**
     * Handle menu button clicks
     */
    handleMenuClick(e) {
        if (!this.isMenuActive) return;
        
        const buttonType = e.target.dataset.menuButton;
        
        switch (buttonType) {
            case 'start':
                this.hide();
                if (this.onStart) this.onStart();
                break;
            case 'login':
                if (this.onLogin) this.onLogin();
                break;
            case 'more':
                if (this.onMore) this.onMore();
                break;
        }
    }

    /**
     * Hide the menu and clear the grid
     */
    hide() {
        this.isMenuActive = false;
        
        // Clear all menu buttons from the grid
        const squares = this.dom.getAllGridSquares();
        squares.forEach(square => {
            if (square.classList.contains('menu-button')) {
                square.textContent = '';
                square.classList.remove('filled', 'menu-button', 'menu-start', 'menu-login', 'menu-more');
                delete square.dataset.menuButton;
            }
        });
    }

    /**
     * Check if menu is currently active
     */
    isActive() {
        return this.isMenuActive;
    }
}
