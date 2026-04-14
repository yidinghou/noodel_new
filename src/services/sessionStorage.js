/**
 * localStorage I/O layer for game sessions.
 * Handles persistence, schema versioning, and error handling.
 */

const STORAGE_KEY = 'noodel_session_v1';
const CURRENT_SCHEMA_VERSION = 3;

export function saveSession(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    if (error.name !== 'QuotaExceededError' && error.name !== 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.warn('Failed to save session:', error);
    }
  }
}

/**
 * Load the session from localStorage.
 * Returns null on schema mismatch, parse error, or missing required fields.
 * The checkpoint field is optional — it can be rebuilt from events.
 */
export function loadSession() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored);

    if (session.schemaVersion !== CURRENT_SCHEMA_VERSION) return null;
    if (!session.sessionId || !session.gameMode || !Array.isArray(session.events)) return null;

    return session;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear session:', error);
  }
}

export function hasSavedSession() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const session = JSON.parse(stored);
    return (
      session.schemaVersion === CURRENT_SCHEMA_VERSION &&
      Boolean(session.sessionId) &&
      Boolean(session.gameMode) &&
      Array.isArray(session.events) &&
      session.events.length > 0
    );
  } catch {
    return false;
  }
}
