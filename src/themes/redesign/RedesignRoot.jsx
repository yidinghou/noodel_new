import { useGame } from '../../context/GameContext.jsx';
import Landing from './screens/Landing.jsx';
import InGame from './screens/InGame.jsx';
import GameOver from './screens/GameOver.jsx';
import './styles/tokens.css';
import './styles/redesign.css';

function RedesignRoot({ onHowToPlay, onSettings }) {
  const { state } = useGame();

  const screen =
    state.status === 'IDLE' ? 'landing' :
    state.status === 'GAME_OVER' ? 'gameover' : 'ingame';

  const handlers = { onHowToPlay, onSettings };

  return (
    <div className="rd-root">
      {screen === 'landing'  && <Landing  {...handlers} />}
      {screen === 'ingame'   && <InGame   {...handlers} />}
      {screen === 'gameover' && <GameOver {...handlers} />}
    </div>
  );
}

export default RedesignRoot;
