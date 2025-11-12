# NOODEL Game - Module Structure

## ES6 Module Organization

The game code has been refactored into ES6 modules for better organization and maintainability.

### File Structure

```
noodel_new/
├── index.html                      # Main HTML file
├── js/
│   ├── main.js                     # Entry point
│   ├── config.js                   # Game configuration constants
│   ├── GameState.js                # Game state management
│   ├── DOMCache.js                 # DOM element caching
│   ├── AnimationController.js      # Animation logic
│   ├── GridController.js           # Grid generation and interaction
│   ├── LetterController.js         # Letter preview and management
│   ├── ScoreController.js          # Scoring and progress tracking
│   ├── WordResolver.js             # Word detection and validation
│   └── Game.js                     # Main game orchestrator
├── styles/
│   ├── base.css                    # Base styles and tokens
│   ├── card.css                    # Card component styles
│   ├── grid.css                    # Grid styles
│   └── made-words.css              # Words list styles
└── script.js                       # Legacy monolithic file (can be removed)
```

### Module Dependencies

```
main.js
  └── Game.js
      ├── config.js
      ├── GameState.js
      │   └── config.js
      ├── DOMCache.js
      ├── AnimationController.js
      │   └── config.js
      ├── GridController.js
      │   └── config.js
      ├── LetterController.js
      │   └── config.js
      ├── ScoreController.js
      └── WordResolver.js
          └── config.js
```

### Module Descriptions

- **config.js**: Contains all game constants (grid size, animation timings, colors)
- **GameState.js**: Pure data model for game state (no DOM or UI logic)
- **DOMCache.js**: Caches DOM element references to avoid repeated queries
- **AnimationController.js**: Handles all animations (title drop, shake, letter drop, word highlighting)
- **GridController.js**: Manages grid generation, click interactions, and gravity physics
- **LetterController.js**: Manages letter preview, advancement, and display
- **ScoreController.js**: Handles scoring, word tracking, and game progress
- **WordResolver.js**: Detects valid words in the grid (horizontal, vertical, diagonal)
- **Game.js**: Main orchestrator that coordinates all controllers
- **main.js**: Entry point that initializes the game

### Running the Game

Since this uses ES6 modules, you need to serve the files through a web server (not `file://`).

**Option 1: Using VS Code Live Server**
1. Install "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

**Option 2: Using Python**
```bash
# Python 3
python -m http.server 8000

# Then open http://localhost:8000
```

**Option 3: Using Node.js**
```bash
npx http-server
```

### Benefits of This Structure

✅ **Separation of Concerns**: Each class has a single, well-defined responsibility
✅ **Maintainability**: Easy to find and modify specific functionality
✅ **Testability**: Individual modules can be tested in isolation
✅ **Reusability**: Classes can be reused in other projects
✅ **Scalability**: Easy to add new features without affecting existing code
✅ **Modern Standards**: Uses ES6+ features and best practices

### Migration Notes

The original `script.js` file contained all code in one file. It has been split into:
- Configuration → `config.js`
- Classes → Individual files per class
- Initialization → `main.js`

All functionality remains the same, just better organized!

## Word Detection Feature

The game now includes automatic word detection that triggers after each letter is placed.

### How It Works

1. **Letter Placement**: Player clicks a column to drop a letter
2. **Word Detection**: After the letter settles, the `WordResolver` scans the grid for valid words
3. **Word Highlighting**: Found words are highlighted in green and shake (similar to the title animation)
4. **Word Recording**: Valid words are added to the "Made Words" list with their direction and length
5. **Cell Clearing**: After the animation, the word cells are cleared
6. **Gravity**: Remaining letters fall down to fill empty spaces
7. **Re-check**: The process repeats to check for new words formed by falling letters

### Word Detection Algorithm

The `WordResolver` checks for words in four directions:
- **Horizontal**: Left to right across rows
- **Vertical**: Top to bottom down columns
- **Diagonal Right**: Top-left to bottom-right
- **Diagonal Left**: Top-right to bottom-left

Words must be:
- At least 3 letters long
- Present in the built-in dictionary
- Made from consecutive filled cells

### Dictionary

The game includes a built-in dictionary with common English words (3-6+ letters). The dictionary can be easily expanded by adding more words to the `initializeDictionary()` method in `WordResolver.js`.

### Animation Sequence

When a word is found:
1. Word cells turn green and shake for 400ms (same animation as title letters)
2. Word is added to the "Made Words" list
3. Cells are cleared after a 200ms delay
4. Gravity is applied to drop remaining letters
5. Process repeats if new words are formed

### Configuration

Word-related timing can be adjusted in `config.js`:
- `WORD_ANIMATION_DURATION`: Duration of highlight and shake (400ms)
- `WORD_CLEAR_DELAY`: Delay before clearing cells (200ms)
