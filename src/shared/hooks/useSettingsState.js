import { useState } from 'react';

export const USERS = ['yiding', 'hannah'];

function getTodayDate() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function getDateForDay(day) {
  const d = new Date();
  if (day === 'yesterday') d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function useSettingsState({ onPlayReplay, onClose } = {}) {
  const [panel, setPanel] = useState(null);
  const [currentUser, setCurrentUser] = useState(
    () => localStorage.getItem('noodel_username') ?? null
  );
  const [scores, setScores] = useState([]);
  const [loadingScores, setLoadingScores] = useState(false);
  const [leaderboardDay, setLeaderboardDay] = useState('today');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [myBestScores, setMyBestScores] = useState([]);
  const [loadingMyBest, setLoadingMyBest] = useState(false);
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

  async function openLeaderboard(day = 'today') {
    setLeaderboardDay(day);
    setPanel('leaderboard');
    setLoadingScores(true);
    try {
      const username = localStorage.getItem('noodel_username') ?? '';
      const dateParam = getDateForDay(day);
      const params = new URLSearchParams({ username, gameMode: 'clear', date: dateParam });
      const res = await fetch(`/api/scores?${params}`);
      setScores(await res.json());
    } catch {
      setScores([]);
    } finally {
      setLoadingScores(false);
    }
  }

  async function switchLeaderboardDay(day) {
    setLeaderboardDay(day);
    setLoadingScores(true);
    try {
      const username = localStorage.getItem('noodel_username') ?? '';
      const dateParam = getDateForDay(day);
      const params = new URLSearchParams({ username, gameMode: 'clear', date: dateParam });
      const res = await fetch(`/api/scores?${params}`);
      setScores(await res.json());
    } catch {
      setScores([]);
    } finally {
      setLoadingScores(false);
    }
  }

  async function openMyBest() {
    setPanel('my-best');
    setLoadingMyBest(true);
    try {
      const username = localStorage.getItem('noodel_username') ?? '';
      const res = await fetch(`/api/scores/my-best?username=${encodeURIComponent(username)}`);
      setMyBestScores(await res.json());
    } catch {
      setMyBestScores([]);
    } finally {
      setLoadingMyBest(false);
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
    scores, loadingScores, openLeaderboard, switchLeaderboardDay,
    leaderboardDay,
    myBestScores, loadingMyBest, openMyBest,
    handleReplay,
    vocabWords, loadingVocab, showVocab, setShowVocab, openVocabulary,
  };
}
