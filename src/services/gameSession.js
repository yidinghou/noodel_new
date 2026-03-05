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
 * Append a WORD_CLEARED event. Sits between DROP_LETTER events so each
 * word removal gets its own seq number — no overwrite, no attribution drift.
 */
export function appendWordClearedEvent(session, wordsCleared, preClearGrid, ts) {
  const newEvent = {
    seq: session.events.length,
    type: 'WORD_CLEARED',
    wordsCleared: wordsCleared || [],
    preRemoveGrid: preClearGrid ? sanitizeGrid(preClearGrid) : null,
    ts
  };
  return { ...session, events: [...session.events, newEvent], lastActivityAt: ts };
}

/**
 * Attach a post-drop grid to the most recent DROP_LETTER event.
 * Called when a drop lands while words are pending — captures the grid
 * with those pending cells shown as static green so replay doesn't skip the drop.
 */
export function addPostDropGrid(session, grid, score, lettersRemaining, nextQueue) {
  const events = session.events;
  let lastDropIdx = -1;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === 'DROP_LETTER') { lastDropIdx = i; break; }
  }
  if (lastDropIdx === -1) return session;

  const updatedEvents = events.map((e, i) =>
    i === lastDropIdx
      ? { ...e, postDropGrid: pendingToMatched(grid), postDropScore: score,
              postDropLettersRemaining: lettersRemaining, postDropNextQueue: nextQueue.slice() }
      : e
  );
  return { ...session, events: updatedEvents };
}

/** Convert isPending cells to isMatched for static replay display. */
function pendingToMatched(grid) {
  return grid.map(cell => {
    if (!cell) return null;
    return {
      char: cell.char, id: cell.id, type: cell.type,
      isMatched: !!(cell.isPending || cell.isMatched),
      isPending: false, pendingDirections: [], pendingResetCount: 0,
      isInitial: cell.isInitial ?? false,
    };
  });
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
 * Maintains a history of snapshots for undo functionality.
 *
 * @param {Object} session - current session
 * @param {Object} stableState - the game state to snapshot
 *   Must have: grid, nextQueue, lettersRemaining, score, madeWords
 * @param {number} afterEventSeq - the seq of the last event that led to this state
 * @returns {Object} new session with updated snapshot
 */
export function takeSnapshot(session, stableState, afterEventSeq) {
  const now = Date.now();

  const newSnapshot = {
    capturedAt: now,
    afterEventSeq,
    grid: sanitizeGrid(stableState.grid),
    nextQueue: stableState.nextQueue.slice(), // shallow copy of queue
    lettersRemaining: stableState.lettersRemaining,
    score: stableState.score,
    madeWords: stableState.madeWords.slice() // shallow copy of words list
  };

  return {
    ...session,
    snapshot: newSnapshot,
    snapshotHistory: [...(session.snapshotHistory || []), newSnapshot]
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
 * Get the payload for undoing to the previous snapshot.
 * Returns null if there's no prior snapshot (less than 2 in history).
 *
 * @param {Object} session
 * @returns {Object|null} payload for LOAD_SAVED_GAME, or null if can't undo
 */
export function getUndoPayload(session) {
  const history = session.snapshotHistory || [];

  // Need at least 2 snapshots to undo to the previous one
  if (history.length < 2) return null;

  // Get the second-to-last snapshot
  const previousSnapshot = history[history.length - 2];

  return {
    grid: previousSnapshot.grid,
    nextQueue: previousSnapshot.nextQueue,
    lettersRemaining: previousSnapshot.lettersRemaining,
    score: previousSnapshot.score,
    madeWords: previousSnapshot.madeWords,
    gameMode: session.gameMode,
    initialBlocks: session.initialBlocks
  };
}

/**
 * Remove the last snapshot from history (for undoing).
 * Returns new session with updated snapshot history.
 *
 * @param {Object} session
 * @returns {Object} new session with last snapshot removed
 */
export function undoSnapshot(session) {
  const history = session.snapshotHistory || [];

  if (history.length < 2) return session;

  const newHistory = history.slice(0, -1);
  return {
    ...session,
    snapshot: newHistory[newHistory.length - 1] || null,
    snapshotHistory: newHistory
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
