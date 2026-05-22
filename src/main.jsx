import { createRoot } from 'react-dom/client';
import { GameProvider } from './context/GameContext.jsx';
import { ThemeProvider } from './themes/ThemeContext.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <GameProvider>
      <App />
    </GameProvider>
  </ThemeProvider>
);
