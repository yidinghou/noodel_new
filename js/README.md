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
      └── ScoreController.js
```

### Module Descriptions

- **config.js**: Contains all game constants (grid size, animation timings, colors)
- **GameState.js**: Pure data model for game state (no DOM or UI logic)
- **DOMCache.js**: Caches DOM element references to avoid repeated queries
- **AnimationController.js**: Handles all animations (title drop, shake, letter drop)
- **GridController.js**: Manages grid generation and click interactions
- **LetterController.js**: Manages letter preview, advancement, and display
- **ScoreController.js**: Handles scoring, word tracking, and game progress
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
