import { useState, useEffect } from 'react';
import { getLocalDateString } from '../utils/seededRandom.js';

export function useStreaks(username) {
  const [streaks, setStreaks] = useState({ loginStreak: 0, clearStreak: 0 });

  useEffect(() => {
    if (!username) return;
    const date = getLocalDateString();
    fetch(`/api/streaks?username=${encodeURIComponent(username)}&date=${date}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStreaks(data); })
      .catch(() => {});
  }, [username]);

  return streaks;
}
