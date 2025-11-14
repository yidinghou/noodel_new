# NOODEL Game - Module Structure

## ES6 Module Organization

The game code has been refactored into ES6 modules with feature flags and declarative animation sequences for better organization and maintainability.

### File Structure

```
noodel_new/
├── index.html                      # Main HTML file
├── REFACTORING_PLAN.md             # Comprehensive refactoring documentation
├── js/
│   ├── main.js                     # Entry point + keyboard shortcuts
│   ├── config.js                   # Game configuration constants
│   ├── FeatureFlags.js             # ✨ Feature flag management system
│   ├── AnimationSequencer.js       # ✨ Declarative animation orchestrator
│   ├── AnimationSequences.js       # ✨ Animation sequence definitions
│   ├── GameState.js                # Game state management
│   ├── DOMCache.js                 # DOM element caching
│   ├── AnimationController.js      # Animation execution methods
│   ├── GridController.js           # Grid generation and interaction
│   ├── LetterController.js         # Letter preview and management
│   ├── ScoreController.js          # Scoring and progress tracking
│   ├── WordResolver.js             # Word detection and validation
│   ├── DictionaryManager.js        # Dictionary loading from CSV files
│   ├── LetterGenerator.js          # Weighted random letter generation
│   ├── MenuController.js           # Menu system with grid-based buttons
│   ├── ScoringUtils.js             # Scrabble-based scoring logic
│   ├── WordItem.js                 # Word data model
│   └── Game.js                     # Main game orchestrator
├── styles/
│   ├── base.css                    # Base styles and tokens
│   ├── card.css                    # Card component styles
│   ├── grid.css                    # Grid styles
│   └── made-words.css              # Words list styles
└── word_list/
    ├── 3_letter_words.csv
    ├── 4_letter_words.csv
    ├── 5_letter_words.csv
    ├── 6_letter_words.csv
    └── 7_letter_words.csv
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

## Feature Flags System

The game includes a comprehensive feature flag system for controlling which features are enabled/disabled.

### Available Flags

**Visual Features:**
- `titleProgressBar`: Show progress bar in NOODEL title
- `wordDetection`: Automatic word detection and scoring
- `gravityPhysics`: Letters fall after word removal
- `letterPreview`: Show next 4 letters
- `scoreTracking`: Track and display score

**UI Features:**
- `menuSystem`: Use menu system vs simple START button

**Animations:**
- `animations.titleDrop`: NOODEL letters drop on load
- `animations.titleShake`: NOODEL shake effect
- `animations.wordHighlight`: Word found animation
- `animations.letterDrop`: Letter placement animation
- `animations.menuFlip`: Menu flip on reset

**Debug:**
- `debug.enabled`: Enable debug mode
- `debug.skipAnimations`: Skip all animations
- `debug.gridPattern`: Load test grid pattern
- `debug.logTiming`: Log animation timing

### Console Commands

```javascript
// Disable features
FeatureFlags.disable('animations.titleDrop')
FeatureFlags.disable('wordDetection')

// Enable features
FeatureFlags.enable('debug.enabled')
FeatureFlags.enable('debug.logTiming')

// Toggle features
FeatureFlags.toggle('gravityPhysics')

// Check status
FeatureFlags.isEnabled('animations.titleShake')

// View all flags
FeatureFlags.getAll()
```

### URL Parameters

Quick testing shortcuts via URL parameters:

```
?debug=true                  // Enable debug mode
?skipAnimations=true         // Disable all animations
?debugGrid=true             // Load test grid pattern
?logTiming=true             // Log animation timing
?noProgressBar=true         // Disable progress bar
?noWordDetection=true       // Disable word detection
?noGravity=true            // Disable gravity physics
?noTitleDrop=true          // Skip title drop animation
?noTitleShake=true         // Skip title shake animation
```

**Examples:**
```
index.html?debug=true&skipAnimations=true    // Fast testing mode
index.html?debugGrid=true&logTiming=true     // Debug with timing logs
index.html?noAnimations=true                 // Skip all animations
```

## Animation Sequencer

The game uses a declarative animation sequencer for managing animation flows.

### Defined Sequences

1. **INTRO_SEQUENCE**: Game load animation
   - Title letters drop randomly
   - Title shake
   - NOODEL word overlay appears
   - Menu shows

2. **DEBUG_INTRO_SEQUENCE**: Fast debug mode load
   - Title shake only
   - Add NOODEL word immediately
   - Show stats and menu

3. **GAME_START_SEQUENCE**: Start button clicked
   - Hide menu
   - Drop NOODEL word to made words list
   - Show stats
   - Initialize progress bar
   - Show letter preview

4. **RESET_SEQUENCE**: Reset button clicked
   - Menu flip animation (parallel)
   - Title shake (parallel)

### Console Commands

```javascript
// Control animation speed
sequencer.setSpeed(0.5)  // Half speed
sequencer.setSpeed(2.0)  // Double speed
sequencer.setSpeed(5.0)  // 5x speed

// Pause and resume
sequencer.pause()
sequencer.resume()

// Check status
sequencer.isRunning()
sequencer.getCurrentSequence()
sequencer.getSequenceNames()
```

### Keyboard Shortcuts

- **ESC**: Speed up animations (1x → 5x → 10x → 1x cycle)
- **Shift+S**: Toggle speed between 1x and 2x

Press ESC during animations to:
- First press: 5x speed (quick preview)
- Second press: 10x speed (nearly instant)
- Third press: Back to normal speed

## Development Tips

### Fast Testing

Load with multiple URL parameters:
```
index.html?debug=true&skipAnimations=true&logTiming=true
```

### Debug Mode Console

When `?debug=true` is set, the console shows:
- All active feature flags on load
- Animation timing logs
- Available console commands
