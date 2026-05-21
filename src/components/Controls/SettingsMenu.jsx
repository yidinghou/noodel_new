import React, { useState, useEffect } from 'react';

const USERS = ['yiding', 'hannah'];

function SettingsMenu({ visible, onClose, isMuted, onToggleMute, onPlayReplay }) {
  const isOnPoc = window.location.pathname.includes('poc.html');
  const switchTarget = isOnPoc ? '/noodel_new/' : '/noodel_new/poc.html';

  const [panel, setPanel] = useState(null); // null | 'login' | 'leaderboard'
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('noodel_username') ?? null);
  const [scores, setScores] = useState([]);
  const [loadingScores, setLoadingScores] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!visible) setPanel(null);
  }, [visible]);

  function selectUser(name) {
    localStorage.setItem('noodel_username', name);
    setCurrentUser(name);
    setPanel(null);
  }

  async function openStats() {
    setPanel('stats');
    setLoadingStats(true);
    try {
      const username = localStorage.getItem('noodel_username') ?? 'anonymous';
      const res = await fetch(`/api/user-stats?username=${encodeURIComponent(username)}`);
      setStats(await res.json());
    } catch {
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }

  async function openLeaderboard() {
    setPanel('leaderboard');
    setLoadingScores(true);
    try {
      const res = await fetch('/api/scores');
      const data = await res.json();
      setScores(data);
    } catch {
      setScores([]);
    } finally {
      setLoadingScores(false);
    }
  }

  async function handleReplay(scoreId) {
    try {
      const res = await fetch(`/api/scores/${scoreId}/session`);
      if (!res.ok) { alert('No replay available for this score.'); return; }
      const session = await res.json();
      if (!session || !Array.isArray(session.events) || session.events.length === 0) {
        alert('Replay data is empty.');
        return;
      }
      const row = scores.find(r => r.id === scoreId);
      onPlayReplay?.({ session, meta: { score: row?.score, createdAt: row?.created_at } });
      onClose?.();
    } catch {
      alert('Failed to load replay.');
    }
  }

  return (
    <div className={`mode-selection-menu settings-variant ${visible ? 'visible' : ''}`}>
      <div className="mode-selection-content">
        <button
          className="mode-selection-close"
          onClick={onClose}
          aria-label="Close settings"
        >
          ✕
        </button>
        <h2 className="mode-selection-title">{panel === 'stats' ? 'Stats' : 'Settings'}</h2>

        {panel === null && (
          <div className="mode-selection-section">
            <div className="mode-selection-buttons">
              <button
                className="mode-selection-btn settings-btn-item"
                onClick={() => setPanel('login')}
              >
                👤 {currentUser ? `Logged in: ${currentUser}` : 'Login'}
              </button>
              <button className="mode-selection-btn settings-btn-item" onClick={openStats}>
                📊 Stats
              </button>
              <button
                className="mode-selection-btn settings-btn-item"
                onClick={openLeaderboard}
              >
                🏆 Leaderboard
              </button>
              <button
                className="mode-selection-btn settings-btn-item"
                onClick={onToggleMute}
              >
                {isMuted ? '🔇 Unmute' : '🔊 Sound'}
              </button>
              <button
                className="mode-selection-btn settings-btn-item"
                onClick={() => { window.location.href = switchTarget; }}
              >
                {isOnPoc ? '🎮 Switch to Classic' : '✨ Switch to New UI'}
              </button>
            </div>
          </div>
        )}

        {panel === 'login' && (
          <div className="mode-selection-section">
            <p className="mode-selection-subtitle">Select your name</p>
            <div className="mode-selection-buttons">
              {USERS.map(name => (
                <button
                  key={name}
                  className={`mode-selection-btn settings-btn-item ${currentUser === name ? 'active' : ''}`}
                  onClick={() => selectUser(name)}
                >
                  {currentUser === name ? '✓ ' : ''}{name.charAt(0).toUpperCase() + name.slice(1)}
                </button>
              ))}
              <button
                className="mode-selection-btn settings-btn-item"
                onClick={() => setPanel(null)}
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {panel === 'stats' && (
          <div className="mode-selection-section">
            <p className="mode-selection-subtitle">
              {currentUser ? `${currentUser}'s Stats` : 'Your Stats'}
            </p>
            {loadingStats ? (
              <p style={{ textAlign: 'center', padding: '1rem' }}>Loading...</p>
            ) : !stats || stats.vocabularySize === 0 ? (
              <p style={{ textAlign: 'center', padding: '1rem' }}>No stats yet — play a game!</p>
            ) : (
              <>
                <div className="leaderboard-row" style={{ justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <span>Vocabulary size</span>
                  <strong>{stats.vocabularySize}</strong>
                </div>
                {stats.topWords.length > 0 && (
                  <div style={{ margin: '0.75rem 0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <p className="mode-selection-subtitle" style={{ fontSize: '0.8em', marginBottom: '0.25rem' }}>
                          Common Words <span style={{ color: '#2e7d32', fontWeight: 900 }}>⬆</span>
                        </p>
                        {stats.topWords.map(({ word, timesMade, isNew }) => (
                          <div key={word} className="leaderboard-row" style={{ justifyContent: 'space-between' }}>
                            <span>{isNew && <span style={{ fontSize: '0.75em' }}>⭐ </span>}{word}</span><span>×{timesMade}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="mode-selection-subtitle" style={{ fontSize: '0.8em', marginBottom: '0.25rem' }}>
                          Rare Words <span style={{ color: '#c62828', fontWeight: 900 }}>⬇</span>
                        </p>
                        {stats.rareWords.map(({ word, timesMade, isNew }) => (
                          <div key={word} className="leaderboard-row" style={{ justifyContent: 'space-between' }}>
                            <span>{isNew && <span style={{ fontSize: '0.75em' }}>💎 </span>}{word}</span><span>×{timesMade}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="mode-selection-buttons" style={{ marginTop: '1rem' }}>
              <button className="mode-selection-btn settings-btn-item" onClick={() => setPanel(null)}>
                ← Back
              </button>
            </div>
          </div>
        )}

        {panel === 'leaderboard' && (
          <div className="mode-selection-section">
            <p className="mode-selection-subtitle">Top Scores</p>
            {loadingScores ? (
              <p style={{ textAlign: 'center', padding: '1rem' }}>Loading...</p>
            ) : scores.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '1rem' }}>No scores yet.</p>
            ) : (
              <div className="leaderboard-list">
                {scores.map((row, i) => (
                  <div key={row.id} className="leaderboard-row">
                    <span className="leaderboard-rank">#{i + 1}</span>
                    <span className="leaderboard-user">{row.username}</span>
                    <span className="leaderboard-score">{row.score}</span>
                    <span className="leaderboard-mode">{row.game_mode}</span>
                    <button
                      className="leaderboard-replay-btn"
                      onClick={() => handleReplay(row.id)}
                      title="Watch replay"
                    >
                      ▶
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mode-selection-buttons" style={{ marginTop: '1rem' }}>
              <button
                className="mode-selection-btn settings-btn-item"
                onClick={() => setPanel(null)}
              >
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsMenu;
