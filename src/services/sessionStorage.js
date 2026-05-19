// Tiny localStorage wrapper for the active game session.
// Single key for now; per-user keying is a future swap.

const STORAGE_KEY = 'noodel_session_v1';

export function save(snapshot) {
  if (!snapshot) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // localStorage may be disabled (private mode), full, or otherwise unavailable.
    // Persistence is best-effort; the game must keep running.
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clear() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
