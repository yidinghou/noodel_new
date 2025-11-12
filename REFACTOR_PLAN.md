# Script.js Refactoring Plan

## Overview
Transform the current procedural code into a modular, class-based architecture with clear separation of concerns.

---

## Phase 1: Configuration & Constants
**Goal:** Extract all magic numbers and configuration values into a single source of truth.

### Tasks:
- [ ] Create `CONFIG` object with grid dimensions, animation timings, and game settings
- [ ] Replace hardcoded values (42, 7, 6, 100, 300, 800, etc.) with named constants
- [ ] Add alphabet constant

**Files Modified:** `script.js`

---

## Phase 2: GameState Class
**Goal:** Isolate all game data into a pure data container.

### Tasks:
- [ ] Create `GameState` class with constructor initializing all state variables
- [ ] Add `reset()` method for resetting state
- [ ] Add getters for computed values (e.g., `isColumnFull(column)`)
- [ ] Replace global state variables with `gameState` instance

**Properties:**
- `started`
- `currentLetterIndex`
- `lettersRemaining`
- `score`
- `columnFillCounts`
- `nextLetters`

---

## Phase 3: DOMCache Class
**Goal:** Cache DOM element references to avoid repeated queries.

### Tasks:
- [ ] Create `DOMCache` class
- [ ] Cache all frequently accessed elements (grid, buttons, previews, stats)
- [ ] Replace all `document.getElementById()` and `querySelector()` calls with cached references

**Cached Elements:**
- Grid container
- Start button
- Mute button
- Next letters preview
- Words list
- Score display
- Letters remaining display
- Controls container
- Stats container

---

## Phase 4: AnimationController Class
**Goal:** Centralize all animation logic.

### Tasks:
- [ ] Create `AnimationController` class
- [ ] Move `randomizeTitleLetterAnimations()` → static method
- [ ] Move `shakeAllTitleLetters()` → static method
- [ ] Move `showControlsAndStats()` → static method
- [ ] Move `dropLetterInColumn()` → instance method (needs state)
- [ ] Add private helper methods for animation stages
- [ ] Use CONFIG constants for timing values

---

## Phase 5: GridController Class
**Goal:** Manage all grid-related operations.

### Tasks:
- [ ] Create `GridController` class with `gameState` dependency
- [ ] Move `generateGrid()` → `generate()` method
- [ ] Move `handleSquareClick()` → instance method
- [ ] Add validation and error handling
- [ ] Add method to get grid square by coordinates
- [ ] Add method to fill grid square

---

## Phase 6: LetterController Class
**Goal:** Handle letter generation and preview display.

### Tasks:
- [ ] Create `LetterController` class with `gameState` dependency
- [ ] Move `initializeNextLetters()` → `initialize()` method
- [ ] Move `displayNextLetters()` → `display()` method
- [ ] Move `advanceToNextLetter()` → `advance()` method
- [ ] Add `getNextLetter()` helper method

---

## Phase 7: ScoreController Class
**Goal:** Manage scoring and word tracking.

### Tasks:
- [ ] Create `ScoreController` class with `gameState` dependency
- [ ] Move `addWord()` → instance method
- [ ] Move `updateLettersRemaining()` → instance method
- [ ] Add game over detection
- [ ] Add word validation (future feature)

---

## Phase 8: Game Class (Main Orchestrator)
**Goal:** Coordinate all components and manage game flow.

### Tasks:
- [ ] Create `Game` class
- [ ] Initialize all controllers in constructor
- [ ] Create `init()` method for setup and initial animations
- [ ] Create `start()` method
- [ ] Create `reset()` method
- [ ] Create `setupEventListeners()` method
- [ ] Handle coordination between components

**Composition:**
- Has `GameState`
- Has `DOMCache`
- Has `GridController`
- Has `LetterController`
- Has `AnimationController`
- Has `ScoreController`

---

## Phase 9: Error Handling & Validation
**Goal:** Add robust error checking throughout.

### Tasks:
- [ ] Add null checks for DOM elements
- [ ] Add boundary validation for grid operations
- [ ] Add try-catch blocks for critical operations
- [ ] Add console warnings/errors for debugging
- [ ] Validate column bounds in click handler

---

## Phase 10: Final Integration & Testing
**Goal:** Ensure everything works together.

### Tasks:
- [ ] Replace DOMContentLoaded handler with new `Game()` initialization
- [ ] Test all existing functionality
- [ ] Verify animations still work
- [ ] Verify game flow (start, play, reset)
- [ ] Check for any missed refactoring opportunities

---

## Expected Final Structure

```
script.js
├── CONFIG (constants)
├── GameState (data model)
├── DOMCache (element references)
├── AnimationController (animations)
├── GridController (grid operations)
├── LetterController (letter management)
├── ScoreController (scoring)
└── Game (orchestrator)
    └── DOMContentLoaded → new Game()
```

---

## Benefits After Refactoring

✅ **Maintainability:** Clear responsibility for each class
✅ **Testability:** Each class can be tested independently
✅ **Scalability:** Easy to add new features
✅ **Readability:** Self-documenting code structure
✅ **Reusability:** Components can be reused
✅ **Debugging:** Easier to trace issues

---

## Notes

- Maintain backward compatibility with HTML/CSS
- Keep all existing functionality working
- No changes to external APIs or interfaces
- Preserve all animation timings and behaviors
