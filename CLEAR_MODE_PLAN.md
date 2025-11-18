# 🎯 CLEAR MODE Implementation Plan

**Date:** November 18, 2025  
**Feature:** New Game Mode - "Clear Mode"  
**Branch:** `feature/clear-mode`

---

## **Executive Summary**

Implement a new game mode called **CLEAR MODE** where:
- **Goal:** Clear the grid (make all cells empty)
- **Starting State:** Grid starts ~50% populated with random letters
- **Letters Available:** UNLIMITED (no letter counter limit)
- **Win Condition:** Remove all letters from the grid
- **Mechanic:** Player keeps placing letters to form words, which are cleared when found

---

## **Game Mode Comparison**

| Feature | Classic Mode | Clear Mode |
|---------|--------------|-----------|
| Starting Grid | Empty | ~50% populated |
| Goal | Maximize score | Clear all cells |
| Letter Supply | 100 letters (limited) | Unlimited |
| Letter Preview | 5 upcoming | 5 upcoming (refreshes) |
| Win Condition | Run out of letters | Grid completely empty |
| Score | Primary metric | Secondary (for fun) |
| Progression | Time-limited by letters | No time limit, progress-based |

---

## **1. Data Model Changes**

### **Add GameMode enum to config.js**
```javascript
export const GameModes = {
    CLASSIC: 'classic',     // Original mode: fill grid, run out of letters
    CLEAR: 'clear'          // New mode: clear populated grid
};
```

### **Extend GameState.js**
Add Clear Mode specific state:
```javascript
export class GameState {
    constructor(gameMode = GameModes.CLASSIC) {
        // ... existing code ...
        
        // Game mode
        this.gameMode = gameMode;
        this.isClearMode = gameMode === GameModes.CLEAR;
        
        // Clear Mode specific state
        if (this.isClearMode) {
            this.initialGridState = []; // Store initial 50% populated grid
            this.cellsClearedCount = 0;  // Track cleared cells
            this.targetCellsToClear = null; // Set during init
        }
    }
    
    /**
     * Get number of empty cells (for Clear Mode progress)
     */
    getEmptyCellCount() {
        let emptyCount = 0;
        for (let col = 0; col < CONFIG.GRID.COLUMNS; col++) {
            const emptyRows = CONFIG.GRID.ROWS - this.columnFillCounts[col];
            emptyCount += emptyRows;
        }
        return emptyCount;
    }
    
    /**
     * Get total populated cells (for Clear Mode)
     */
    getPopulatedCellCount() {
        const totalCells = CONFIG.GRID.ROWS * CONFIG.GRID.COLUMNS;
        return totalCells - this.getEmptyCellCount();
    }
    
    /**
     * Get Clear Mode progress (0-100%)
     */
    getClearModeProgress() {
        if (!this.targetCellsToClear || this.targetCellsToClear === 0) return 0;
        return Math.min(100, (this.cellsClearedCount / this.targetCellsToClear) * 100);
    }
}
```

---

## **2. Grid Initialization for Clear Mode**

### **Create ClearModeInitializer.js**
```javascript
import { CONFIG } from '../config.js';

export class ClearModeInitializer {
    /**
     * Populate grid with ~50% random letters
     * @param {GameState} state - Game state to populate
     * @param {LetterGenerator} letterGenerator - For generating random letters
     * @returns {Array} Array of populated cells: [{row, col, letter}, ...]
     */
    static populateGridWithLetters(state, letterGenerator) {
        const totalCells = CONFIG.GRID.ROWS * CONFIG.GRID.COLUMNS;
        const targetPopulatedCells = Math.floor(totalCells * 0.5); // 50%
        
        const grid = [];
        let populatedCount = 0;
        
        // Generate random positions and letters
        while (populatedCount < targetPopulatedCells) {
            const col = Math.floor(Math.random() * CONFIG.GRID.COLUMNS);
            const row = Math.floor(Math.random() * CONFIG.GRID.ROWS);
            const cellKey = `${row}-${col}`;
            
            // Skip if already populated
            if (grid.some(cell => cell.row === row && cell.col === col)) {
                continue;
            }
            
            const letter = letterGenerator.generateSingleLetter();
            grid.push({ row, col, letter });
            populatedCount++;
        }
        
        return grid;
    }
    
    /**
     * Apply initial grid population to DOM
     * @param {HTMLElement} gameGrid - Grid container
     * @param {Array} populatedCells - Cells to populate
     */
    static applyGridPopulation(gameGrid, populatedCells) {
        populatedCells.forEach(({ row, col, letter }) => {
            const index = row * CONFIG.GRID.COLUMNS + col;
            const square = gameGrid.children[index];
            
            if (square) {
                square.textContent = letter;
                square.classList.add('filled');
                square.dataset.letter = letter;
            }
        });
    }
    
    /**
     * Update GameState to reflect initial grid population
     * @param {GameState} state - State to update
     * @param {Array} populatedCells - Cells that were populated
     */
    static updateGameState(state, populatedCells) {
        // Count cells per column
        const columnFill = Array(CONFIG.GRID.COLUMNS).fill(0);
        
        populatedCells.forEach(({ col, row }) => {
            // Track how many cells are filled in each column
            // Cells are "filled from bottom" so track from bottom
            columnFill[col]++;
        });
        
        state.columnFillCounts = columnFill;
        state.initialGridState = populatedCells;
        state.targetCellsToClear = populatedCells.length;
        state.cellsClearedCount = 0;
    }
}
```

---

## **3. Game Mode Selection Interface**

### **Update MenuController.js**
Add CLEAR mode button to start menu:
```javascript
this.menuWords = [
    {
        word: 'START',           // Classic mode
        row: 1,
        startCol: 1,
        className: 'menu-start',
        gameMode: GameModes.CLASSIC,
        hasArrow: true,
        arrowCol: 0
    },
    {
        word: 'CLEAR',           // Clear mode
        row: 3,
        startCol: 1,
        className: 'menu-clear',
        gameMode: GameModes.CLEAR,
        hasArrow: false
    },
    {
        word: 'LOGIN',
        row: 3.5,
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
```

Update handleMenuClick to pass game mode:
```javascript
handleMenuClick(e) {
    const buttonType = e.target.dataset.menuButton;
    const gameMode = e.target.dataset.gameMode || GameModes.CLASSIC;
    
    switch (buttonType) {
        case 'start':
        case 'clear':
            this.hide();
            if (this.onStart) this.onStart(gameMode);
            break;
        // ... rest of cases
    }
}
```

---

## **4. Game.js Modifications**

### **Store current game mode**
```javascript
export class Game {
    constructor() {
        // ... existing code ...
        this.currentGameMode = GameModes.CLASSIC;
    }
}
```

### **Update start() method to accept mode parameter**
```javascript
async start(gameMode = GameModes.CLASSIC) {
    this.currentGameMode = gameMode;
    this.state.gameMode = gameMode;
    this.state.isClearMode = gameMode === GameModes.CLEAR;
    
    this.state.started = true;
    this.dom.startBtn.textContent = '🔄';
    
    // Handle mode-specific setup
    if (gameMode === GameModes.CLEAR) {
        await this.initializeClearMode();
    }
    
    // ... rest of existing start logic ...
}
```

### **Add initializeClearMode() method**
```javascript
async initializeClearMode() {
    const context = {
        state: this.state,
        dom: this.dom,
        score: this.score,
        animator: this.animator,
        game: this
    };
    
    // Populate grid with ~50% letters
    const letterGenerator = new LetterGenerator();
    const populatedCells = ClearModeInitializer.populateGridWithLetters(
        this.state,
        letterGenerator
    );
    
    // Apply to DOM
    ClearModeInitializer.applyGridPopulation(this.dom.grid, populatedCells);
    ClearModeInitializer.updateGameState(this.state, populatedCells);
    
    // Update UI for Clear Mode
    this.updateUIForClearMode();
    
    // Play initialization animation
    await this.sequencer.play('clearModeStart', context);
}
```

### **Add updateUIForClearMode() method**
```javascript
updateUIForClearMode() {
    // Change "Letters Remaining" to "Grid Progress"
    const lettersLabel = this.dom.querySelector('.stat-label');
    if (lettersLabel && lettersLabel.textContent === 'Letters Remaining') {
        lettersLabel.textContent = 'Clear Progress';
    }
    
    // Show grid clear progress instead of letters counter
    this.updateClearModeProgress();
    
    // Hide preview if desired (optional - infinite letters means preview is infinite)
    // this.dom.preview.classList.remove('visible');
}
```

### **Add updateClearModeProgress() method**
```javascript
updateClearModeProgress() {
    if (this.state.isClearMode) {
        const progress = this.state.getClearModeProgress();
        const progressPercent = Math.round(progress);
        const remainingCells = this.state.targetCellsToClear - this.state.cellsClearedCount;
        
        // Update progress display (e.g., "45% (21 cells)")
        this.dom.lettersRemaining.textContent = `${remainingCells}/${this.state.targetCellsToClear}`;
        
        // Update progress bar if available
        this.animator.updateLetterProgress(remainingCells, this.state.targetCellsToClear);
    }
}
```

### **Update checkAndProcessWords() for Clear Mode**
```javascript
async checkAndProcessWords() {
    if (this.isProcessingWords) return;
    this.isProcessingWords = true;
    
    try {
        let wordsFound = true;
        while (wordsFound) {
            const foundWords = this.wordResolver.checkForWords();
            
            if (foundWords.length > 0) {
                // Existing animation logic...
                
                // Track cleared cells for Clear Mode
                if (this.state.isClearMode) {
                    foundWords.forEach(wordData => {
                        this.state.cellsClearedCount += wordData.positions.length;
                    });
                    
                    // Update progress display
                    this.updateClearModeProgress();
                    
                    // Check if grid is cleared
                    if (this.state.cellsClearedCount >= this.state.targetCellsToClear) {
                        await this.handleClearModeComplete();
                    }
                }
                
                // ... rest of existing logic ...
            } else {
                wordsFound = false;
            }
        }
    } finally {
        this.isProcessingWords = false;
    }
}
```

### **Add handleClearModeComplete() method**
```javascript
async handleClearModeComplete() {
    console.log('🎉 Clear Mode Complete!');
    
    const context = {
        state: this.state,
        dom: this.dom,
        score: this.score,
        finalScore: this.state.score
    };
    
    // Play victory animation sequence
    await this.sequencer.play('clearModeComplete', context);
    
    // Show game over state
    this.state.started = false;
    this.dom.startBtn.textContent = '🎮';
}
```

### **Update reset() for game mode awareness**
```javascript
async reset() {
    // Reset with current game mode
    this.state.reset();
    this.state.gameMode = this.currentGameMode;
    this.state.isClearMode = this.currentGameMode === GameModes.CLEAR;
    
    // ... existing reset logic ...
}
```

---

## **5. Animation Sequences**

### **Add to AnimationSequences.js**
```javascript
export const SEQUENCES = {
    // ... existing sequences ...
    
    clearModeStart: [
        {
            name: 'revealGrid',
            method: 'revealGridWithPopulation',
            target: 'animator',
            duration: 800,
            parallel: false
        },
        {
            name: 'flashStats',
            method: 'showStats',
            target: 'score',
            duration: 300,
            parallel: true
        },
        {
            name: 'updateProgress',
            method: 'updateLetterProgress',
            target: 'animator',
            args: (ctx) => [ctx.state.targetCellsToClear - ctx.state.cellsClearedCount, ctx.state.targetCellsToClear],
            duration: 0,
            parallel: true
        }
    ],
    
    clearModeComplete: [
        {
            name: 'celebrateAllCells',
            method: 'celebrateGridClear',
            target: 'animator',
            duration: 1200,
            parallel: false
        },
        {
            name: 'showVictoryMessage',
            method: 'showVictoryOverlay',
            target: 'animator',
            duration: 1000,
            args: (ctx) => [`Clear Mode Complete!\nScore: ${ctx.finalScore}`],
            parallel: false,
            onAfter: (ctx) => {
                // Wait for user to acknowledge
                return new Promise(resolve => {
                    const onDismiss = () => {
                        document.removeEventListener('click', onDismiss);
                        resolve();
                    };
                    document.addEventListener('click', onDismiss);
                    setTimeout(() => {
                        document.removeEventListener('click', onDismiss);
                        resolve();
                    }, 5000); // Auto-dismiss after 5 seconds
                });
            }
        },
        {
            name: 'showMenu',
            method: 'show',
            target: 'menu',
            duration: 400,
            parallel: false
        }
    ]
};
```

### **Add animation methods to AnimationController.js**
```javascript
/**
 * Celebrate grid being cleared (cascade effect)
 */
async celebrateGridClear() {
    return new Promise(resolve => {
        const squares = Array.from(this.dom.getAllGridSquares());
        
        // Stagger celebration animation
        squares.forEach((square, index) => {
            const delay = (index % CONFIG.GRID.COLUMNS) * 50;
            
            setTimeout(() => {
                square.classList.add('celebrate');
            }, delay);
        });
        
        // Remove celebration class after animation
        setTimeout(() => {
            squares.forEach(square => {
                square.classList.remove('celebrate');
            });
            resolve();
        }, 800);
    });
}

/**
 * Show victory overlay
 */
async showVictoryOverlay(message) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'victory-overlay';
        overlay.innerHTML = `<div class="victory-message">${message}</div>`;
        
        document.body.appendChild(overlay);
        
        // Animate in
        setTimeout(() => overlay.classList.add('show'), 10);
        
        // Remove after animation
        setTimeout(() => {
            overlay.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve();
            }, 300);
        }, 4700);
    });
}

/**
 * Animate revealing grid with populated letters
 */
async revealGridWithPopulation() {
    return new Promise(resolve => {
        const squares = Array.from(this.dom.getAllGridSquares());
        
        // Stagger reveal animation for populated cells
        squares.forEach((square, index) => {
            if (square.classList.contains('filled')) {
                const delay = Math.random() * 300;
                
                setTimeout(() => {
                    square.classList.add('reveal');
                }, delay);
            }
        });
        
        // Remove reveal class after animation
        setTimeout(() => {
            squares.forEach(square => {
                if (square.classList.contains('filled')) {
                    square.classList.remove('reveal');
                }
            });
            resolve();
        }, 600);
    });
}
```

---

## **6. UI/CSS Updates**

### **Add to styles/grid.css**
```css
/* Clear Mode grid animations */
.grid-square.celebrate {
    animation: celebrate 0.6s ease-out;
}

@keyframes celebrate {
    0% {
        transform: scale(1) rotateZ(0deg);
        opacity: 1;
    }
    50% {
        transform: scale(1.2) rotateZ(-5deg);
    }
    100% {
        transform: scale(0.8) rotateZ(0deg);
        opacity: 0;
    }
}

.grid-square.reveal {
    animation: reveal 0.4s ease-in-out;
}

@keyframes reveal {
    0% {
        transform: rotateY(90deg);
        opacity: 0;
    }
    100% {
        transform: rotateY(0deg);
        opacity: 1;
    }
}

/* Victory overlay */
.victory-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.victory-overlay.show {
    opacity: 1;
}

.victory-message {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem;
    border-radius: 1rem;
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    animation: victoryPulse 0.5s ease-out;
}

@keyframes victoryPulse {
    0% {
        transform: scale(0.5);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}
```

### **Update styles/card.css for Clear Mode label**
```css
/* Clear mode progress label */
.stat-label {
    transition: color 0.3s ease;
}

.stat-label.clear-mode {
    color: #ff6b6b;
}
```

---

## **7. Implementation Checklist**

### **Phase 1: Core Infrastructure**
- [ ] Create `CLEAR_MODE_PLAN.md` (this file) ✅
- [ ] Add `GameModes` enum to `config.js`
- [ ] Create `ClearModeInitializer.js`
- [ ] Extend `GameState.js` with Clear Mode state
- [ ] Add game mode tracking to `Game.js`

### **Phase 2: Menu Integration**
- [ ] Update `MenuController.js` to show CLEAR option
- [ ] Update `onStart` callback to accept game mode
- [ ] Update `Game.js.start()` to handle game mode

### **Phase 3: Clear Mode Gameplay**
- [ ] Implement `initializeClearMode()`
- [ ] Add grid population logic
- [ ] Implement `updateClearModeProgress()`
- [ ] Add Clear Mode win condition in `checkAndProcessWords()`
- [ ] Implement `handleClearModeComplete()`

### **Phase 4: Animations & UI**
- [ ] Add animation sequences (`clearModeStart`, `clearModeComplete`)
- [ ] Add animation methods to `AnimationController.js`
- [ ] Add CSS animations for Clear Mode
- [ ] Test all animations

### **Phase 5: Testing & Polish**
- [ ] Test mode selection from menu
- [ ] Test grid initialization (50% populated)
- [ ] Test letter generation (unlimited)
- [ ] Test word detection and clearing
- [ ] Test win condition and victory screen
- [ ] Test reset from Clear Mode
- [ ] Test switching between modes

---

## **8. Key Files to Modify**

| File | Changes |
|------|---------|
| `js/config.js` | Add `GameModes` enum, `CLEAR_MODE_CELL_PERCENTAGE` |
| `js/core/GameState.js` | Add Clear Mode state tracking |
| `js/core/Game.js` | Add mode support, Clear Mode initialization, win condition |
| `js/menu/MenuController.js` | Add CLEAR button, mode parameter to callbacks |
| `js/animation/AnimationController.js` | Add Clear Mode animation methods |
| `js/animation/AnimationSequences.js` | Add Clear Mode sequences |
| `js/ClearModeInitializer.js` | **NEW FILE** - Grid population logic |
| `styles/grid.css` | Add Clear Mode animations |
| `styles/card.css` | Add Clear Mode styling |
| `CLEAR_MODE_PLAN.md` | **NEW FILE** - This document |

---

## **9. Testing Strategy**

### **Manual Testing Checklist**
- [ ] Start game in Classic Mode → verify 100 letters, empty grid
- [ ] Start game in Clear Mode → verify ~50% populated, unlimited letters
- [ ] Play Clear Mode → form words, clear cells
- [ ] Clear entire grid → victory animation plays
- [ ] Reset from Clear Mode → start new Clear Mode game
- [ ] Switch modes → Play Classic → Reset → Play Clear → verify correct mode
- [ ] Word detection → Works same as Classic Mode
- [ ] Score tracking → Works correctly in both modes
- [ ] Letter animation → Smooth in both modes
- [ ] Mobile responsiveness → Both modes work on mobile

### **Edge Cases**
- [ ] Try to clear an impossible grid configuration
- [ ] Form multiple words simultaneously in Clear Mode
- [ ] Reset mid-game
- [ ] Victory while in middle of animation
- [ ] No words possible with current letters

---

## **10. Future Enhancements**

### **Level System**
- [ ] Easy: 30% populated grid
- [ ] Medium: 50% populated grid
- [ ] Hard: 70% populated grid
- [ ] Expert: 90% populated grid (almost full!)

### **Power-ups**
- [ ] Shuffle: Rearrange letters randomly
- [ ] Freeze: Temporarily prevent gravity
- [ ] Hint: Show a possible word to form

### **Leaderboards**
- [ ] Track fastest clear time
- [ ] Track highest score in Clear Mode
- [ ] Persist scores to localStorage

### **Custom Grids**
- [ ] Create custom Clear Mode challenges
- [ ] Share grid configurations
- [ ] Community challenge mode

---

## **11. Branch Strategy**

```bash
# Create feature branch
git checkout -b feature/clear-mode

# Work on implementation
# Commit frequently

# When complete, create pull request for review
# git push origin feature/clear-mode
```

---

## **12. Success Criteria**

✅ **MUST HAVE:**
1. Clear Mode accessible from start menu
2. Grid starts ~50% populated with random letters
3. Letters are unlimited
4. Win condition: Clear all cells
5. Victory animation and message
6. Can return to menu or start new game

✅ **SHOULD HAVE:**
1. Mode-specific UI labels (Grid Progress instead of Letters)
2. Smooth animations for grid reveal and victory
3. Score tracking works in both modes
4. Can switch between Classic and Clear modes

✅ **NICE TO HAVE:**
1. Power-ups or level system
2. Leaderboard tracking
3. Custom grid configurations

---

**End of Clear Mode Implementation Plan**

*Created: November 18, 2025*
