import { useGame } from '../../../context/GameContext.jsx';

function GameOver() {
  const { state, dispatch } = useGame();

  const stats = [
    { label: 'Score',      value: state.score },
    { label: 'Words made', value: state.madeWords.length },
  ];

  const onHome = () => dispatch({ type: 'RESET' });
  const onRestart = () => dispatch({ type: 'START_GAME', payload: { mode: state.gameMode } });

  return (
    <div className="rd-screen rd-gameover">
      <div className="rd-gameover__card">
        <h1 className="rd-gameover__title">Game Over</h1>
        <p className="rd-gameover__intro">A solid run. Here's how it went.</p>

        <dl className="rd-stat-grid">
          {stats.map((s) => (
            <div key={s.label} className="rd-stat-grid__row">
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>

        <div className="rd-gameover__actions">
          <button type="button" className="rd-cta" onClick={onRestart}>
            Play Again
          </button>
          <button type="button" className="rd-link-btn" onClick={onHome}>
            Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOver;
