/**
 * React hook for managing game session recording and persistence.
 * Orchestrates gameSession (data model) and sessionStorage (localStorage I/O).
 */

import { useRef } from 'react';
import { createSession, appendEvent, takeSnapshot, completeSession, getUndoPayload, undoSnapshot } from '../services/gameSession.js';
import { saveSession, loadSession, clearSession } from '../services/sessionStorage.js';

export function useGameSession() {
  const sessionRef = useRef(null);

  /**
   * Initialize a new game session when a game starts.
   * Only called for non-tutorial games (tutorial is excluded from history).
   *
   * @param {string} mode - 'classic' | 'clear'
   * @param {Array} initialQueue - the pre-generated letter sequence
   * @param {Array} initialGrid - the pre-generated grid (or null for classic)
   * @param {Array} initialBlocks - pre-filled block indices for clear mode
   */
  function onGameStart(mode, initialQueue, initialGrid, initialBlocks) {
    const session = createSession(mode, initialQueue, initialGrid, initialBlocks);
    sessionRef.current = session;
    saveSession(session);
  }

  /**
   * Record a DROP_LETTER event. Called at dispatch time (before reducer processes it).
   * Updates lastActivityAt in session.
   *
   * @param {number} column - the column that was clicked
   */
  function recordDropEvent(column) {
    if (!sessionRef.current) return;

    const updatedSession = appendEvent(
      sessionRef.current,
      'DROP_LETTER',
      { column },
      Date.now()
    );

    sessionRef.current = updatedSession;
    // Don't save yet - wait for state to settle (snapshot will handle persistence)
  }

  /**
   * Capture a snapshot when the game state is stable.
   * Called after APPLY_GRAVITY, after clean DROP_LETTER (no words), or on GAME_OVER.
   *
   * @param {Object} stableState - the stable game state
   *   Must have: grid, nextQueue, lettersRemaining, score, madeWords, status
   */
  function onStableState(stableState) {
    if (!sessionRef.current) return;

    // Determine which event seq this snapshot is after
    const afterEventSeq = sessionRef.current.events.length > 0
      ? sessionRef.current.events[sessionRef.current.events.length - 1].seq
      : -1;

    let updatedSession = takeSnapshot(sessionRef.current, stableState, afterEventSeq);

    // Mark session as completed if game is over
    if (stableState.status === 'GAME_OVER') {
      updatedSession = completeSession(updatedSession);
    }

    sessionRef.current = updatedSession;
    saveSession(updatedSession);
  }

  /**
   * Get the currently loaded session.
   * @returns {Object|null}
   */
  function getSavedSession() {
    return sessionRef.current;
  }

  /**
   * Load a saved session from localStorage into memory.
   * @returns {Object|null}
   */
  function loadSavedSession() {
    const session = loadSession();
    if (session) {
      sessionRef.current = session;
    }
    return session;
  }

  /**
   * Clear both the in-memory session and localStorage.
   * Called when user starts a new game or resets.
   */
  function clearSavedSession() {
    sessionRef.current = null;
    clearSession();
  }

  /**
   * Get the undo payload if undo is possible.
   * Returns null if no prior snapshot exists.
   * @returns {Object|null}
   */
  function getUndo() {
    if (!sessionRef.current) return null;
    return getUndoPayload(sessionRef.current);
  }

  /**
   * Perform undo by reverting to previous snapshot.
   * Updates both in-memory session and localStorage.
   */
  function performUndo() {
    if (!sessionRef.current) return;

    const updatedSession = undoSnapshot(sessionRef.current);
    sessionRef.current = updatedSession;
    saveSession(updatedSession);
  }

  return {
    onGameStart,
    recordDropEvent,
    onStableState,
    getSavedSession,
    loadSavedSession,
    clearSavedSession,
    getUndo,
    performUndo
  };
}
