import { CONFIG, GameModes } from '../config.js';
import { calculateIndex } from '../grid/gridUtils.js';


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
                gameMode: GameModes.CLASSIC,
                hasArrow: true,
                arrowCol: 0
            },
            {
                word: 'CLEAR',
                row: 2.5,
                startCol: 1,
                className: 'menu-clear',
                gameMode: GameModes.CLEAR,
                hasArrow: false
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
     * @param {Game} game - Game instance for clearing inactivity timer
     */
    show(useFlip = false, game = null) {
        this.isMenuActive = true;
        this.menuButtonsData = []; // Store for later drop animation
        this.game = game; // Store game instance
        
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
        
        // Store button data for later use
        this.menuButtonsData = menuButtons;
        
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
        } else if (!FeatureFlags.isEnabled('animations.menuDrop')) {
            // Skip drop animation - place buttons directly in grid
            this.showMenuButtonsDirectly(menuButtons);
            setTimeout(() => {
                console.log('Adding menu click handlers...');
                this.addMenuClickHandlers();
            }, 100);
        } else {
            // Show buttons in preview position (no drop animation yet)
            this.showMenuButtonsInPreview(menuButtons);
            
            // Setup grid click listener to trigger drop
            this.setupGridClickListener();
            
            // Add click handlers after drop completes
            // (Will be called from animateMenuDrop)
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
        const { word, row, startCol, className, hasArrow, arrowCol, gameMode } = menuItem;
        const buttonData = [];
        
        // Add arrow if specified
        if (hasArrow && arrowCol !== undefined) {
            const arrowIndex = calculateIndex(row, arrowCol, CONFIG.GRID.COLUMNS);
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
                    isArrow: true,
                    gameMode: gameMode
                });
            }
        }
        
        // Add word letters
        for (let i = 0; i < word.length; i++) {
            const col = Math.floor(startCol + i);
            const index = calculateIndex(row, col, CONFIG.GRID.COLUMNS);
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
                    isArrow: false,
                    gameMode: gameMode
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
     * Show menu buttons directly in grid (no animation)
     */
    showMenuButtonsDirectly(menuButtons) {
        menuButtons.forEach(buttonData => {
            const { square, letter, className, word, isArrow, gameMode } = buttonData;
            
            // Place content and classes directly
            square.textContent = letter;
            square.classList.add('filled', isArrow ? 'menu-arrow' : 'menu-button', className);
            if (!isArrow) {
                square.dataset.menuButton = word.toLowerCase();
                if (gameMode) {
                    square.dataset.gameMode = gameMode;
                }
            }
        });
    }

    /**
     * Show menu buttons in preview position without dropping (for initial menu display)
     */
    showMenuButtonsInPreview(menuButtons) {
        menuButtons.forEach(buttonData => {
            const { square, letter, className, word, isArrow, gameMode } = buttonData;
            
            // Get preview spacer for this column
            const spacer = this.dom.preview.querySelector(`[data-column="${buttonData.col}"]`);
            
            if (spacer) {
                // Show letter in preview position
                spacer.textContent = letter;
                spacer.classList.add('filled', isArrow ? 'menu-arrow' : 'menu-button', className);
                if (!isArrow) {
                    spacer.dataset.menuButton = word.toLowerCase();
                    if (gameMode) {
                        spacer.dataset.gameMode = gameMode;
                    }
                }
                
                // Store reference for click handler
                buttonData.previewElement = spacer;
            }
        });
        
        this.waitingForGridClick = true; // Flag to indicate we're waiting for grid click
        
        // Add click handlers immediately to preview buttons
        setTimeout(() => {
            console.log('Adding menu click handlers to preview...');
            this.addMenuClickHandlers();
        }, 100);
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
        
        this.waitingForGridClick = false; // No longer waiting
        
        // Add click handlers after all animations complete
        const dropDuration = 420;
        const totalAnimationTime = (menuButtons.length * dropInterval) + dropDuration;
        
        setTimeout(() => {
            console.log('Adding menu click handlers...');
            this.addMenuClickHandlers();
        }, totalAnimationTime);
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
     * Add click handlers for menu buttons (both in grid and in preview)
     */
    addMenuClickHandlers() {
        let handlerCount = 0;
        
        // Add handlers to grid squares
        const squares = this.dom.getAllGridSquares();
        squares.forEach(square => {
            if (square.classList.contains('menu-button')) {
                square.addEventListener('click', (e) => this.handleMenuClick(e));
                handlerCount++;
            }
        });
        
        // Add handlers to preview elements (if menu is in preview mode)
        const spacers = this.dom.preview.querySelectorAll('.preview-letter-block');
        spacers.forEach(spacer => {
            if (spacer.classList.contains('menu-button')) {
                spacer.addEventListener('click', (e) => this.handleMenuClick(e));
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
        const gameMode = e.target.dataset.gameMode || GameModes.CLASSIC;
        
        switch (buttonType) {
            case 'start':
            case 'clear':
                console.log(`Starting game in ${gameMode} mode...`);
                this.hide();
                if (this.onStart) this.onStart(gameMode);
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
     * Trigger the drop animation when grid is clicked
     */
    triggerDrop(game) {
        if (!this.waitingForGridClick || !this.menuButtonsData) return;
        
        // Clear inactivity timer and stop pulsating when grid is clicked
        if (game && game.clearInactivityTimer) {
            game.clearInactivityTimer();
            game.hasClickedGrid = true;
        }
        
        // Clear preview elements
        const spacers = this.dom.preview.querySelectorAll('.preview-letter-block');
        spacers.forEach(spacer => {
            spacer.textContent = '';
            spacer.classList.remove('filled', 'menu-button', 'menu-start', 'menu-login', 'menu-more', 'menu-arrow');
            delete spacer.dataset.menuButton;
        });
        
        // Trigger the drop animation
        this.animateMenuDrop(this.menuButtonsData);
    }

    /**
     * Clear preview tiles (for reset)
     */
    clearPreviewTiles() {
        const spacers = this.dom.preview.querySelectorAll('.preview-letter-block');
        spacers.forEach(spacer => {
            spacer.textContent = '';
            spacer.classList.remove('filled', 'menu-button', 'menu-start', 'menu-login', 'menu-more', 'menu-arrow');
            delete spacer.dataset.menuButton;
        });
    }

    /**
     * Hide the menu and clear the grid
     */
    hide() {
        this.isMenuActive = false;
        this.waitingForGridClick = false;
        
        // Clear preview elements
        this.clearPreviewTiles();
        
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
     * Setup a one-time click listener on the grid to trigger drop
     */
    setupGridClickListener() {
        if (this.gridClickHandler) {
            // Remove existing handler if present
            this.dom.grid.removeEventListener('click', this.gridClickHandler);
        }
        
        this.gridClickHandler = (e) => {
            // Only trigger if we're waiting and click is on a grid square
            if (this.waitingForGridClick && e.target.classList.contains('grid-square')) {
                this.triggerDrop(this.game);
                // Remove the handler after first click
                this.dom.grid.removeEventListener('click', this.gridClickHandler);
                this.gridClickHandler = null;
            }
        };
        
        this.dom.grid.addEventListener('click', this.gridClickHandler);
    }

    /**
     * Check if menu is currently active
     */
    isActive() {
        return this.isMenuActive;
    }
}
