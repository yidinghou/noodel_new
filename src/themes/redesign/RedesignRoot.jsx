import { useGame } from '../../context/GameContext.jsx';
import { STATUS } from '../../utils/gameConstants.js';
import Landing from './screens/Landing.jsx';
import InGame from './screens/InGame.jsx';
import GameOver from './screens/GameOver.jsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/grid.css';
import './styles/card.css';
import './styles/made-words.css';
import './styles/redesign.css';

function RedesignRoot({ dictionary, onHowToPlay, onLogin, onSettings }) {
  const { state } = useGame();

  const screen =
    state.status === STATUS.IDLE ? 'landing' :
    state.status === STATUS.GAME_OVER ? 'gameover' : 'ingame';

  const handlers = { onHowToPlay, onLogin, onSettings };

  return (
    <div className="rd-root">
      {screen === 'landing'  && <Landing  {...handlers} />}
      {screen === 'ingame'   && <InGame   {...handlers} dictionary={dictionary} />}
      {screen === 'gameover' && <GameOver {...handlers} />}
    </div>
  );
}

export default RedesignRoot;
