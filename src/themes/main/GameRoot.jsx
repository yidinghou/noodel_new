import { useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import { STATUS } from '../../utils/gameConstants.js';
import Landing from './screens/Landing.jsx';
import InGame from './screens/InGame.jsx';
import GameOver from './screens/GameOver.jsx';
import AdminScreenPicker from './components/AdminScreenPicker.jsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/grid.css';
import './styles/card.css';
import './styles/made-words.css';
import './styles/redesign.css';

const isAdmin = import.meta.env.DEV || new URLSearchParams(window.location.search).get('admin') === 'true';

function GameRoot({ dictionary, onHowToPlay, onLogin, onSettings }) {
  const { state } = useGame();
  const [previewScreen, setPreviewScreen] = useState(null);

  const naturalScreen =
    state.status === STATUS.IDLE ? 'landing' :
    state.status === STATUS.GAME_OVER ? 'gameover' : 'ingame';

  const screen = previewScreen ?? naturalScreen;

  const handlePickScreen = (s) => setPreviewScreen(s === naturalScreen ? null : s);

  const handlers = { onHowToPlay, onLogin, onSettings };

  return (
    <div className="root">
      {screen === 'landing'  && <Landing  {...handlers} />}
      {screen === 'ingame'   && <InGame   {...handlers} dictionary={dictionary} />}
      {screen === 'gameover' && <GameOver {...handlers} />}
      {isAdmin && <AdminScreenPicker current={screen} onSelect={handlePickScreen} />}
    </div>
  );
}

export default GameRoot;
