/**
 * Pure data model functions for game session management.
 * No React, no side effects, no I/O. Fully testable and composable.
 *
 * Session schema v3: event-sourced, no snapshots.
 * Three event types: DROP_LETTER, WORDS_CLEARED, GRAVITY.
 * A single checkpoint (derivable from events) is cached for fast resume.
 */

export function generateSessionId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  return `${timestamp}-${random}`;
}

/**
 * Create a fresh session document.
 * @param {string} mode - 'classic' | 'clear'
 * @param {Array} initialQueue - full pre-generated letter sequence
 * @param {Array|null} initialGrid - 42-cell grid for clear mode, null for classic
 * @param {Array} initialBlocks - pre-filled block indices (clear mode)
 */
export function createSession(mode, initialQueue, initialGrid, initialBlocks) {
  const now = Date.now();
  return {
    schemaVersion: 3,
    sessionId: generateSessionId(),
    gameMode: mode,
    startedAt: now,
    lastActivityAt: now,
    status: 'in_progress',
    initialQueue: [...(initialQueue ?? [])],
    initialGrid: initialGrid ? sanitizeGrid(initialGrid) : null,
    initialBlocks: [...(initialBlocks ?? [])],
    events: [],
    checkpoint: null,
  };
}

/**
 * Append an event to the session. Immutable — returns new session.
 * @param {Object} session
 * @param {string} type - event type
 * @param {Object} payload
 * @param {number} ts - timestamp
 */
export function appendEvent(session, type, payload, ts) {
  // seq = events.length before append → dense 0-indexed integers (0, 1, 2, …).
  // preClearGrid in replayEngine relies on this to look up seq-1 as "prior state".
  const event = { seq: session.events.length, type, payload: { ...payload }, ts };
  return {
    ...session,
    events: [...session.events, event],
    lastActivityAt: ts,
  };
}

/**
 * Store a checkpoint derived from replaying all events.
 * The checkpoint is an optimization for fast resume — it is always derivable
 * from events and never the source of truth.
 *
 * @param {Object} session
 * @param {Object} state - current stable game state
 */
export function setCheckpoint(session, state) {
  const lastSeq = session.events.length > 0
    ? session.events[session.events.length - 1].seq
    : -1;

  return {
    ...session,
    checkpoint: {
      afterEventSeq: lastSeq,
      grid: sanitizeGrid(state.grid),
      nextQueue: state.nextQueue.slice(),
      lettersRemaining: state.lettersRemaining,
      score: state.score,
      madeWords: state.madeWords.slice(),
    },
  };
}

export function completeSession(session) {
  return { ...session, status: 'completed' };
}

/**
 * Build the LOAD_SAVED_GAME payload from the checkpoint.
 * Returns null if there is no checkpoint and no events to replay.
 */
export function buildLoadPayload(session) {
  const cp = session.checkpoint;
  if (!cp) return null;
  return {
    grid: cp.grid,
    nextQueue: cp.nextQueue,
    lettersRemaining: cp.lettersRemaining,
    score: cp.score,
    madeWords: cp.madeWords,
    gameMode: session.gameMode,
    initialBlocks: session.initialBlocks,
  };
}

// ─── Tile sanitization ───────────────────────────────────────────────────────

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
    isInitial: tile.isInitial ?? false,
  };
}

function sanitizeGrid(grid) {
  return grid.map(sanitizeTile);
}
