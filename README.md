# NOODEL Word Game 🎮

A fun and engaging word-building game built with vanilla JavaScript, HTML5, and CSS3.

## 🎯 About

NOODEL is an interactive word puzzle game where players create words by strategically placing letters on a grid. The game features smooth animations, scoring system, and an intuitive interface.

## 🚀 Live Demo

[Play NOODEL on Railway](https://your-app-name.up.railway.app)

## 🛠️ Features

- **Interactive Gameplay**: Drop letters strategically to form words
- **Smooth Animations**: CSS-based animations with customizable timing
- **Scoring System**: Points based on word length and complexity  
- **Responsive Design**: Works on desktop and mobile devices
- **Feature Flags**: URL parameters for debugging and customization
- **Word Detection**: Automatic detection of valid English words

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

# Start local server
npm start
```

Visit `http://localhost:3000` to play locally.

### Debug Features

Add these URL parameters for debugging:

- `?debug=true` - Enable debug mode
- `?skipAnimations=true` - Skip all animations
- `?debugGrid=true` - Show grid pattern overlay
- `?logTiming=true` - Log animation timing

Example: `http://localhost:3000?debug=true&skipAnimations=true`

## 🚀 Deployment on Railway

1. **Connect Repository**: Link your GitHub repository to Railway
2. **Deploy**: Railway will automatically detect the Node.js app and deploy
3. **Environment**: Set `NODE_ENV=production` in Railway dashboard
4. **Custom Domain** (Optional): Configure your custom domain in Railway

### Quick Deploy Button

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/noodel-word-game)

## 📁 Project Structure

```
noodel_new/
├── js/                     # JavaScript modules
│   ├── core/              # Core game logic
│   ├── animation/         # Animation system
│   ├── grid/             # Grid management
│   ├── letter/           # Letter handling
│   ├── menu/             # Menu system
│   ├── scoring/          # Scoring logic
│   └── word/             # Word detection & dictionary
├── styles/               # CSS stylesheets
├── word_list/           # Word dictionaries (CSV)
├── index.html           # Main HTML file
├── server.js            # Express server for deployment
├── package.json         # Node.js dependencies
└── railway.toml         # Railway configuration
```

## 🎨 Customization

### Animation Speed

```javascript
// In browser console
sequencer.setSpeed(2.0);  // 2x speed
sequencer.setSpeed(0.5);  // Half speed
```

### Feature Flags

```javascript
// In browser console
features.disable("animations.titleDrop");
features.enable("debug.gridPattern");
```

## 📝 Technical Details

- **Frontend**: Vanilla JavaScript ES6+ modules
- **Backend**: Express.js (for static file serving)
- **Deployment**: Railway with automatic deployments
- **Word Lists**: CSV-based dictionary with 3-7 letter words
- **Animations**: CSS-based with JavaScript timing control

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

Built with ❤️ using vanilla JavaScript and deployed on Railway.