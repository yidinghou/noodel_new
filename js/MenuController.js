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
                className: 'menu-start',
                hasArrow: true,
                arrowCol: 0
            },
            {
                word: 'LOGIN',
                row: 3,
                startCol: 1,
                className: 'menu-login',
                hasArrow: false
            },
            {
                word: 'MORE',
                row: 5,
                startCol: 1.5,
                className: 'menu-more',
                hasArrow: false
            }
        ];
    }

    /**
     * Show the menu by displaying button words in the grid
     * @param {boolean} useFlip - If true, uses flip animation instead of drop (for reset)
     */
    show(useFlip = false) {
        this.isMenuActive = true;
        
        // Clear the grid first
        const squares = this.dom.getAllGridSquares();
        squares.forEach(square => {
            square.textContent = '';
            square.classList.remove('filled', 'menu-button', 'menu-start', 'menu-login', 'menu-more', 'menu-arrow', 'flipping');
        });
        
        // Show preview squares (one for each column)
        this.showColumnPreviews();
        
        // Collect all menu button data (square, letter, position)
        const menuButtons = [];
        
        // Collect menu button data for each word
        this.menuWords.forEach(menuItem => {
            const buttonData = this.collectMenuButtonData(menuItem);
            menuButtons.push(...buttonData);
        });
        
        // Choose animation based on mode
        if (useFlip) {
            this.animateMenuFlip(menuButtons);
            // Flip animation with stagger: (buttons × interval) + flip duration
            const flipInterval = 40;
            const flipDuration = 400;
            const totalFlipTime = (menuButtons.length * flipInterval) + flipDuration;
            setTimeout(() => {
                console.log('Adding menu click handlers...');
                this.addMenuClickHandlers();
            }, totalFlipTime);
        } else {
            // Animate buttons dropping in with randomized order
            this.animateMenuDrop(menuButtons);
            
            // Add click handlers after all animations complete
            // Calculate total animation time: (number of buttons × interval) + drop duration
            const dropInterval = 80;
            const dropDuration = 420;
            const totalAnimationTime = (menuButtons.length * dropInterval) + dropDuration;
            
            setTimeout(() => {
                console.log('Adding menu click handlers...');
                this.addMenuClickHandlers();
            }, totalAnimationTime);
        }
    }

    /**
     * Show preview area (spacers are already in HTML, no need to create)
     */
    showColumnPreviews() {
        // Spacers are already in the HTML, just ensure preview is visible
        this.dom.preview.classList.add('visible');
    }

    /**
     * Collect menu button data for animation
     */
    collectMenuButtonData(menuItem) {
        const { word, row, startCol, className, hasArrow, arrowCol } = menuItem;
        const buttonData = [];
        
        // Add arrow if specified
        if (hasArrow && arrowCol !== undefined) {
            const arrowIndex = row * CONFIG.GRID.COLUMNS + arrowCol;
            const arrowSquare = this.dom.getGridSquare(arrowIndex);
            
            if (arrowSquare) {
                buttonData.push({
                    square: arrowSquare,
                    letter: '→',
                    className: 'menu-arrow',
                    word: word.toLowerCase(),
                    index: arrowIndex,
                    row: row,
                    col: arrowCol,
                    isArrow: true
                });
            }
        }
        
        // Add word letters
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
                    col: col,
                    isArrow: false
                });
            }
        }
        
        return buttonData;
    }

    /**
     * Animate menu buttons flipping in place (for reset, synchronized with title shake)
     */
    animateMenuFlip(menuButtons) {
        // Randomize flip order
        const shuffled = [...menuButtons];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Flip each button with a staggered delay
        const flipInterval = 40; // ms between each flip (faster than drop)
        
        shuffled.forEach((buttonData, flipOrder) => {
            const delay = flipOrder * flipInterval;
            
            setTimeout(() => {
                const { square, letter, className, word, isArrow } = buttonData;
                
                // Place content and classes with flip animation
                square.textContent = letter;
                square.classList.add('filled', isArrow ? 'menu-arrow' : 'menu-button', className, 'flipping');
                if (!isArrow) {
                    square.dataset.menuButton = word;
                }
            }, delay);
        });
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
        const { square, letter, className, word, col } = buttonData;
        
        // Get the target square's position
        const targetRect = square.getBoundingClientRect();
        
        // Get the grid to determine starting position
        const gridRect = this.dom.grid.getBoundingClientRect();
        
        // Create overlay element for the drop animation (grid-square sized)
        const overlay = document.createElement('div');
        overlay.className = 'dropping-letter-overlay menu-dropping';
        overlay.textContent = letter;
        
        // Position overlay 10px above the grid top
        const startTop = gridRect.top - targetRect.height - 10;
        
        overlay.style.left = `${targetRect.left}px`;
        overlay.style.top = `${startTop}px`; // Bottom of square is at grid top
        overlay.style.width = `${targetRect.width}px`; // Grid square width
        overlay.style.height = `${targetRect.height}px`; // Grid square height
        
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
        let handlerCount = 0;
        
        squares.forEach(square => {
            if (square.classList.contains('menu-button')) {
                square.addEventListener('click', (e) => this.handleMenuClick(e));
                handlerCount++;
            }
        });
        
        console.log(`Added ${handlerCount} menu click handlers`);
    }

    /**
     * Handle menu button clicks
     */
    handleMenuClick(e) {
        console.log('Menu click detected', e.target.textContent, e.target.dataset.menuButton);
        
        if (!this.isMenuActive) {
            console.log('Menu not active, ignoring click');
            return;
        }
        
        const buttonType = e.target.dataset.menuButton;
        
        switch (buttonType) {
            case 'start':
                console.log('Starting game...');
                this.hide();
                if (this.onStart) this.onStart();
                break;
            case 'login':
                console.log('Login clicked...');
                if (this.onLogin) this.onLogin();
                break;
            case 'more':
                console.log('More clicked...');
                if (this.onMore) this.onMore();
                break;
        }
    }

    /**
     * Hide the menu and clear the grid
     */
    hide() {
        this.isMenuActive = false;
        
        // Clear all menu buttons and arrows from the grid
        const squares = this.dom.getAllGridSquares();
        squares.forEach(square => {
            if (square.classList.contains('menu-button') || square.classList.contains('menu-arrow')) {
                square.textContent = '';
                square.classList.remove('filled', 'menu-button', 'menu-start', 'menu-login', 'menu-more', 'menu-arrow');
                delete square.dataset.menuButton;
            }
        });
        
        // Keep preview spacers visible (they stay for the entire session)
        // Preview will be replaced with actual letter preview when game starts
    }

    /**
     * Check if menu is currently active
     */
    isActive() {
        return this.isMenuActive;
    }
}
