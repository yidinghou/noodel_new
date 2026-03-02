/**
 * localStorage I/O layer for game sessions.
 * Handles persistence, schema versioning, and error handling.
 */

const STORAGE_KEY = 'noodel_session_v1';
const CURRENT_SCHEMA_VERSION = 1;

/**
 * Save a session document to localStorage.
 * Silently swallows quota exceeded errors and parse errors.
 * @param {Object} session
 */
export function saveSession(session) {
  try {
    const serialized = JSON.stringify(session);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    // Silently ignore quota exceeded, permission denied, etc.
    // User can still play, just won't have resume capability
    if (error.name !== 'QuotaExceededError' && error.name !== 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.warn('Failed to save session:', error);
    }
  }
}

/**
 * Load the session document from localStorage.
 * Returns null if nothing saved, schema mismatch, parse error, or corrupted data.
 * @returns {Object|null}
 */
export function loadSession() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored);

    // Reject if schema version doesn't match
    if (session.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      return null;
    }

    // Basic validation: session should have required fields
    if (!session.sessionId || !session.gameMode || !session.snapshot) {
      return null;
    }

    return session;
  } catch (error) {
    // Parse error or other issue - return null
    return null;
  }
}

/**
 * Remove the saved session from localStorage.
 */
export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear session:', error);
  }
}

/**
 * Check if a resumable session exists without loading the full document.
 * @returns {boolean}
 */
export function hasSavedSession() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    const session = JSON.parse(stored);

    // Check schema and required fields
    return (
      session.schemaVersion === CURRENT_SCHEMA_VERSION &&
      session.sessionId &&
      session.gameMode &&
      session.snapshot !== null
    );
  } catch (error) {
    return false;
  }
}
