import { useState } from 'react';

export const USERS = ['yiding', 'hannah'];

export function useSettingsState({ onPlayReplay, onClose } = {}) {
  const [panel, setPanel] = useState(null);
  const [currentUser, setCurrentUser] = useState(
    () => localStorage.getItem('noodel_username') ?? null
  );
  const [scores, setScores] = useState([]);
  const [loadingScores, setLoadingScores] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [vocabWords, setVocabWords] = useState([]);
  const [loadingVocab, setLoadingVocab] = useState(false);
  const [showVocab, setShowVocab] = useState(false);

  function selectUser(name) {
    localStorage.setItem('noodel_username', name);
    setCurrentUser(name);
    setPanel(null);
  }

  function logout() {
    localStorage.removeItem('noodel_username');
    setCurrentUser(null);
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
      setScores(await res.json());
    } catch {
      setScores([]);
    } finally {
      setLoadingScores(false);
    }
  }

  async function openVocabulary() {
    setShowVocab(true);
    setLoadingVocab(true);
    try {
      const username = localStorage.getItem('noodel_username') ?? 'anonymous';
      const res = await fetch(`/api/vocabulary?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      setVocabWords(data.words?.map(w => w.word) ?? []);
    } catch {
      setVocabWords([]);
    } finally {
      setLoadingVocab(false);
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

  return {
    panel, setPanel,
    currentUser, selectUser, logout,
    stats, loadingStats, openStats,
    scores, loadingScores, openLeaderboard,
    handleReplay,
    vocabWords, loadingVocab, showVocab, setShowVocab, openVocabulary,
  };
}
