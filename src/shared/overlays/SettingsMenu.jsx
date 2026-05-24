import { useSettingsState } from '../hooks/useSettingsState.js';
import { useTheme } from '../../themes/ThemeContext.jsx';
import { useGame } from '../../context/GameContext.jsx';
import { formatDailyDate } from '../../utils/seededRandom.js';
import { STATUS } from '../../utils/gameConstants.js';
import { A } from '../../utils/actionTypes.js';
import WordListModal from './WordListModal.jsx';
import './SettingsMenu.css';

function SettingsMenu({ onClose, isMuted, onToggleMute, onPlayReplay }) {
  const s = useSettingsState({ onPlayReplay, onClose });
  const { themeId, setThemeId, themes } = useTheme();
  const { state, dispatch } = useGame();
  const isPlaying = state.status !== STATUS.IDLE;

  const title =
    s.panel === 'stats'       ? 'Stats'
    : s.panel === 'leaderboard' ? 'Leaderboard'
    : s.panel === 'my-best'   ? 'My Best Games'
    : s.panel === 'theme'     ? 'Theme'
    : 'Settings';

  if (s.showVocab) {
    return (
      <WordListModal
        words={s.vocabWords}
        onClose={() => s.setShowVocab(false)}
        title="My Vocabulary"
      />
    );
  }

  return (
    <div className="settings-menu" onClick={onClose}>
      <div className="settings-menu__card" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          className="settings-menu__close"
          onClick={onClose}
          aria-label="Close settings"
        >✕</button>
        <h2 className="settings-menu__title">{title}</h2>

        {s.panel === null && (
          <div className="settings-menu__list">
            <button className="settings-menu__btn" onClick={s.openStats}>
              <span>📊 Stats</span>
              <span aria-hidden="true">›</span>
            </button>
            <button className="settings-menu__btn" onClick={() => s.openLeaderboard()}>
              <span>🏆 Leaderboard</span>
              <span aria-hidden="true">›</span>
            </button>
            <button className="settings-menu__btn" onClick={s.openMyBest}>
              <span>🥇 My Best</span>
              <span aria-hidden="true">›</span>
            </button>
            <button className="settings-menu__btn" onClick={s.openVocabulary}>
              <span>📖 Vocabulary</span>
              <span aria-hidden="true">›</span>
            </button>
            <button className="settings-menu__btn" onClick={onToggleMute}>
              <span>{isMuted ? '🔇 Unmute' : '🔊 Sound'}</span>
            </button>
            <button className="settings-menu__btn" onClick={() => s.setPanel('theme')}>
              <span>🎨 Theme: {themes.find(t => t.id === themeId)?.name}</span>
              <span aria-hidden="true">›</span>
            </button>
            {isPlaying && (
              <button className="settings-menu__btn" onClick={() => { dispatch({ type: A.RESET }); onClose?.(); }}>
                <span>🏠 Home</span>
              </button>
            )}
          </div>
        )}

        {s.panel === 'theme' && (
          <div className="settings-menu__list">
            {themes.map(t => (
              <button
                key={t.id}
                className={`settings-menu__btn settings-menu__theme${themeId === t.id ? ' is-active' : ''}`}
                onClick={() => { setThemeId(t.id); onClose?.(); }}
              >
                <span>
                  <strong>{themeId === t.id ? '✓ ' : ''}{t.name}</strong>
                  <em className="settings-menu__theme-blurb">{t.blurb}</em>
                </span>
              </button>
            ))}
            <button className="settings-menu__btn" onClick={() => s.setPanel(null)}>← Back</button>
          </div>
        )}

        {s.panel === 'stats' && (
          <div>
            {s.loadingStats ? (
              <p className="settings-menu__empty">Loading…</p>
            ) : !s.stats || s.stats.vocabularySize === 0 ? (
              <p className="settings-menu__empty">No stats yet — play a game!</p>
            ) : (
              <div className="settings-menu__stats">
                <div className="settings-menu__stats-row">
                  <span>Vocabulary size</span>
                  <strong>{s.stats.vocabularySize}</strong>
                </div>
                {s.stats.topWords?.length > 0 && (
                  <div className="settings-menu__words">
                    <div className="settings-menu__subtitle">Top words</div>
                    {s.stats.topWords.map(w => (
                      <div key={w.word} className="settings-menu__word-row">
                        <span>⭐ {w.word}</span>
                        <span>×{w.count}</span>
                      </div>
                    ))}
                  </div>
                )}
                {s.stats.rareWords?.length > 0 && (
                  <div className="settings-menu__words">
                    <div className="settings-menu__subtitle">Rare finds</div>
                    {s.stats.rareWords.map(w => (
                      <div key={w.word} className="settings-menu__word-row">
                        <span>💎 {w.word}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button className="settings-menu__btn" onClick={() => s.setPanel(null)} style={{ marginTop: 12 }}>← Back</button>
          </div>
        )}

        {s.panel === 'leaderboard' && (
          <div>
            <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
              {['today', 'yesterday'].map(day => (
                <button
                  key={day}
                  onClick={() => s.switchLeaderboardDay(day)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: s.leaderboardDay === day ? '#2e7d32' : '#ddd',
                    color: s.leaderboardDay === day ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    fontWeight: s.leaderboardDay === day ? '600' : '400',
                  }}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </button>
              ))}
            </div>
            {s.loadingScores ? (
              <p className="settings-menu__empty">Loading…</p>
            ) : s.scores.length === 0 ? (
              <p className="settings-menu__empty">No scores yet.</p>
            ) : (
              <div className="settings-menu__leaderboard">
                {s.scores.map((row, i, arr) => {
                  const isUser = row.username === s.currentUser;
                  const prevRank = arr[i - 1]?.rank ?? 0;
                  const showSeparator = row.rank > 5 && prevRank <= 5;
                  return [
                    showSeparator && <div key={`sep-${row.id}`} className="settings-menu__separator">···</div>,
                    <div key={row.id} className={`settings-menu__row${isUser ? ' is-user' : ''}`}>
                      <span className="settings-menu__rank">#{row.rank}</span>
                      <span className="settings-menu__name">{row.username || 'anonymous'}</span>
                      <span className="settings-menu__score">{row.score}</span>
                      <button
                        type="button"
                        className="settings-menu__replay"
                        onClick={() => s.handleReplay(row.id)}
                        aria-label="Play replay"
                      >▶</button>
                    </div>
                  ];
                }).flat()}
              </div>
            )}
            <button className="settings-menu__btn" onClick={() => s.setPanel(null)} style={{ marginTop: 12 }}>← Back</button>
          </div>
        )}

        {s.panel === 'my-best' && (
          <div>
            {s.loadingMyBest ? (
              <p className="settings-menu__empty">Loading…</p>
            ) : s.myBestScores.length === 0 ? (
              <p className="settings-menu__empty">No scores yet — play a game!</p>
            ) : (
              <div className="settings-menu__leaderboard">
                {s.myBestScores.map((row) => {
                  const gameDate = row.game_date ? row.game_date.split('T')[0] : '';
                  return (
                    <div key={row.id} className="settings-menu__row is-user">
                      <span className="settings-menu__score">{row.score}</span>
                      <span style={{ fontSize: '0.8em', color: '#999' }}>{gameDate}</span>
                      <button
                        type="button"
                        className="settings-menu__replay"
                        onClick={() => s.handleReplay(row.id)}
                        aria-label="Play replay"
                      >▶</button>
                    </div>
                  );
                })}
              </div>
            )}
            <button className="settings-menu__btn" onClick={() => s.setPanel(null)} style={{ marginTop: 12 }}>← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsMenu;
