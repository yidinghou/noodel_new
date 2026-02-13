import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { GameProvider } from './context/GameContext.jsx';
import './styles/base.css';
import './styles/card.css';
import './styles/grid.css';
import './styles/made-words.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>
);
