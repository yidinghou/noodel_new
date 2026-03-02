/**
 * Pure data model functions for game session management.
 * No React, no side effects, no I/O. Fully testable and composable.
 */

/**
 * Generate a simple unique session ID.
 * Uses a timestamp + random suffix. Backend-agnostic, works with any database/auth system.
 * @returns {string}
 */
export function generateSessionId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  return `${timestamp}-${random}`;
}

/**
 * Create a fresh session document at game start.
 * @param {string} mode - 'classic' | 'clear'
 * @param {Array} initialQueue - pre-generated letter sequence (full queue)
 * @param {Array} initialGrid - pre-generated grid (null for classic, array for clear mode)
 * @param {Array} initialBlocks - grid indices of pre-filled blocks (clear mode)
 * @returns {Object} session document
 */
export function createSession(mode, initialQueue, initialGrid, initialBlocks) {
  const now = Date.now();
  return {
    schemaVersion: 1,
    sessionId: generateSessionId(),
    gameMode: mode,
    startedAt: now,
    lastActivityAt: now,
    status: 'in_progress',

    // Replay data
    initialQueue: [...initialQueue], // copy to prevent mutation
    initialGrid: initialGrid ? [...initialGrid] : null,
    initialBlocks: [...(initialBlocks || [])],

    // Event log (append-only)
    events: [],

    // Latest stable snapshot (for resume)
    snapshot: null
  };
}

/**
 * Append an event to the session. Immutable - returns new session.
 * @param {Object} session - current session
 * @param {string} eventType - 'DROP_LETTER'
 * @param {Object} payload - event payload (e.g., { column: 3 })
 * @param {number} ts - timestamp (Date.now())
 * @returns {Object} new session with event appended
 */
export function appendEvent(session, eventType, payload, ts) {
  const newEvent = {
    seq: session.events.length,
    type: eventType,
    payload: { ...payload },
    ts
  };

  return {
    ...session,
    events: [...session.events, newEvent],
    lastActivityAt: ts
  };
}

/**
 * Remove animation-only fields from a tile to sanitize for storage.
 * @param {Object|null} tile - grid tile or null
 * @returns {Object|null} sanitized tile
 */
function sanitizeTile(tile) {
  if (!tile) return null;
  return {
    char: tile.char,
    id: tile.id,
    type: tile.type,
    isMatched: false,
    isPending: false,
    pendingDirections: [],
    pendingResetCount: 0,
    isInitial: tile.isInitial ?? false
  };
}

/**
 * Sanitize the entire grid by removing animation state from tiles.
 * @param {Array} grid - 42-element grid
 * @returns {Array} sanitized grid
 */
export function sanitizeGrid(grid) {
  return grid.map(sanitizeTile);
}

/**
 * Create a snapshot of the current game state. Immutable - returns new session.
 * Only call this when state is stable (no pending/matched animations in progress).
 *
 * @param {Object} session - current session
 * @param {Object} stableState - the game state to snapshot
 *   Must have: grid, nextQueue, lettersRemaining, score, madeWords
 * @param {number} afterEventSeq - the seq of the last event that led to this state
 * @returns {Object} new session with updated snapshot
 */
export function takeSnapshot(session, stableState, afterEventSeq) {
  const now = Date.now();

  return {
    ...session,
    snapshot: {
      capturedAt: now,
      afterEventSeq,
      grid: sanitizeGrid(stableState.grid),
      nextQueue: stableState.nextQueue.slice(), // shallow copy of queue
      lettersRemaining: stableState.lettersRemaining,
      score: stableState.score,
      madeWords: stableState.madeWords.slice() // shallow copy of words list
    }
  };
}

/**
 * Mark a session as completed (when game is over).
 * @param {Object} session
 * @returns {Object} new session with status set to 'completed'
 */
export function completeSession(session) {
  return {
    ...session,
    status: 'completed'
  };
}

/**
 * Build the action payload needed for LOAD_SAVED_GAME reducer action.
 * Returns null if session has no snapshot.
 *
 * @param {Object} session
 * @returns {Object|null} payload for LOAD_SAVED_GAME, or null if no snapshot
 */
export function buildLoadPayload(session) {
  if (!session.snapshot) return null;

  const { grid, nextQueue, lettersRemaining, score, madeWords } = session.snapshot;

  return {
    grid,
    nextQueue,
    lettersRemaining,
    score,
    madeWords,
    gameMode: session.gameMode,
    initialBlocks: session.initialBlocks
  };
}
