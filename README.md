# NOODEL Word Game 🎮

A fun and engaging word-building game built with React, Vite, and Framer Motion.

## 🎯 About

NOODEL is an interactive word puzzle game where players create words by strategically placing letters on a grid. The game features smooth animations powered by Framer Motion, dynamic scoring, game mode selection, and an intuitive component-based interface.

## 🚀 Live Demo

[Play NOODEL on Railway](https://your-app-name.up.railway.app)

## 🛠️ Features

- **Interactive Gameplay**: Drop letters strategically to form words
- **Multiple Game Modes**: Classic mode and Clear mode (empty the board)
- **Smooth Animations**: Framer Motion-powered animations for letter drops and interactions
- **Dynamic Scoring**: Real-time score tracking with word history
- **Responsive Design**: Modern React component architecture with clean separation of concerns
- **Word Detection**: Automatic detection of valid English words (horizontal & vertical)
- **Game Over Overlay**: Win/loss display with mode-specific feedback

## 🎮 How to Play

1. Click the "🎮" button to start
2. Letters will appear in the preview area
3. Click on grid columns to drop letters
4. Form words horizontally, vertically, or diagonally
5. Longer words score more points!

## 🔧 Development

### Local Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/noodel-word-game.git
cd noodel-word-game

# Install dependencies
npm install
```

### Running the Application

**Development Mode (with hot reload):**
```bash
npm run dev
```
Visit `http://localhost:5173` to play locally. Changes to React components and styles will automatically refresh in the browser.

**Production Build:**
```bash
npm run build
```
Generates optimized bundle in the `dist/` folder.

**Preview Production Build:**
```bash
npm run preview
```

**Production Server:**
```bash
npm start
```
Runs the Express server on port 3000 (used for Railway deployment).

### Testing

The project uses Jest with jsdom for unit testing core game logic and utilities.

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=gameReducer
```

#### Test Structure

```
src/__tests__/
├── gameReducer.test.js       # Game state management logic
├── gracePeriodUtils.test.js  # Grace period calculation tests
├── wordUtils.test.js         # Word detection and validation
└── ...                        # Additional utility tests
```

#### Test Coverage

The test suite focuses on:
- **Game State**: Redux-style reducer patterns for game mode, score, and word history
- **Word Detection**: Horizontal and vertical word scanning algorithms
- **Grace Periods**: Word validity timing and scoring logic
- **Utilities**: Game constants, grid calculations, and helper functions

#### Writing Tests

Tests use Jest and target ES modules:

```javascript
// Example: Testing game reducer
import { gameReducer, initialGameState } from '../context/GameReducer';

test('should handle letter placement', () => {
  const newState = gameReducer(initialGameState, {
    type: 'PLACE_LETTER',
    payload: { row: 0, col: 0, letter: 'A' }
  });

  expect(newState.grid[0][0]).toBe('A');
});
```

### Debug Features

Add these URL parameters for debugging:

- `?debug=true` - Enable debug mode
- `?skipAnimations=true` - Skip all animations
- `?debugGrid=true` - Show grid pattern overlay
- `?logTiming=true` - Log animation timing
- `?betaClearModeEmptyBoard=true` - Beta: Win condition when board is completely empty (stricter challenge)

Example: `http://localhost:3000?debug=true&skipAnimations=true`
Example: `http://localhost:3000?betaClearModeEmptyBoard=true`

## 🚀 Deployment on Railway

1. **Connect Repository**: Link your GitHub repository to Railway
2. **Deploy**: Railway will automatically detect the Node.js app and deploy
3. **Environment**: Set `NODE_ENV=production` in Railway dashboard
4. **Custom Domain** (Optional): Configure your custom domain in Railway

### Quick Deploy Button

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/noodel-word-game)

## 📁 Project Structure

```
src/
├── components/
│   ├── Controls/           # UI Controls
│   │   ├── Actions.jsx     # Game action buttons
│   │   ├── ModeSelector.jsx # Game mode selection
│   │   └── NextPreview.jsx # Upcoming letter preview
│   ├── Grid/              # Game board
│   │   ├── Board.jsx      # Grid container
│   │   ├── Cell.jsx       # Individual grid cell
│   │   └── DroppingOverlay.jsx # Animation overlay
│   ├── Layout/            # Page layout
│   │   ├── GameLayout.jsx # Main layout structure
│   │   └── Header.jsx     # Page header
│   ├── Overlays/          # Game state overlays
│   │   └── GameOverOverlay.jsx # Win/loss display
│   └── Stats/             # Score and stats display
│       ├── MadeWords.jsx  # Word history
│       └── ScoreBoard.jsx # Current score
├── context/
│   ├── GameContext.jsx    # React Context for global state
│   └── GameReducer.js     # State management reducer
├── hooks/
│   ├── useDictionary.js   # Dictionary loading hook
│   ├── useGameLogic.js    # Core game logic hook
├── utils/
│   ├── clearModeUtils.js  # Clear mode specific logic
│   ├── gameConstants.js   # Game configuration
│   └── gameUtils.js       # Utility functions
├── App.jsx               # Root component
└── main.jsx              # Entry point

public/
├── word_lists/           # Word dictionaries (CSV)
└── ...                   # Static assets

index.html               # Vite entry HTML
server.js                # Express server for production
package.json             # Dependencies and scripts
vite.config.js           # Vite configuration
jest.config.js           # Jest testing configuration
railway.toml             # Railway deployment config
```

## 🏗️ Architecture

**State Management**: React Context + Reducer pattern for centralized game state
**Component Communication**: Props-based communication with context for global state
**Animations**: Framer Motion for smooth, performant animations
**Build Tool**: Vite for fast development and optimized production builds
**Backend**: Express.js for static file serving in production

## 🎨 Customization

### Game Constants

Edit `src/utils/gameConstants.js` to customize:
- Grid dimensions (rows/columns)
- Letter pool and distribution
- Scoring multipliers
- Animation timings

### Styling

Global styles and component-specific styling can be found throughout the component files. The design uses CSS-in-JS patterns combined with standard CSS.

## 📝 Technical Details

- **Frontend**: React 18.2 with Vite
- **Styling**: Modern CSS with responsive design
- **Animations**: Framer Motion for component animations
- **State Management**: React Context + useReducer hook
- **Build Tool**: Vite with React plugin for fast HMR development
- **Backend**: Express.js with gzip compression for static file serving
- **Testing**: Jest with jsdom for unit testing core logic
- **Deployment**: Railway with automatic deployments
- **Word Lists**: CSV-based dictionaries with 3-7 letter words
- **Grid**: 6 rows × 7 columns (42 cells) with gravity-based letter stacking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Future Enhancements

- [ ] Multiplayer mode
- [ ] Daily challenges
- [ ] Word definitions popup
- [ ] Achievement system
- [ ] Sound effects
- [ ] Theme customization

---

Built with ❤️ using React, Vite, and Framer Motion. Deployed on Railway.