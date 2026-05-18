/**
 * React hook for session recording and persistence.
 * Records three event types: DROP_LETTER, WORDS_CLEARED, GRAVITY.
 * Every event is persisted to localStorage immediately (crash-safe).
 */

import { useRef } from 'react';
import {
  createSession,
  appendEvent,
  setCheckpoint,
  completeSession,
  buildLoadPayload,
} from '../services/gameSession.js';
import { saveSession, loadSession, clearSession, saveReplaySession } from '../services/sessionStorage.js';

export function useGameSession() {
  const sessionRef = useRef(null);

  function onGameStart(mode, initialQueue, initialGrid, initialBlocks) {
    const session = createSession(mode, initialQueue, initialGrid, initialBlocks);
    sessionRef.current = session;
    saveSession(session);
  }

  function recordDrop(column, letter) {
    if (!sessionRef.current) return;
    sessionRef.current = appendEvent(sessionRef.current, 'DROP_LETTER', { column, letter }, Date.now());
    saveSession(sessionRef.current);
  }

  function recordClear(words) {
    if (!sessionRef.current) return;
    sessionRef.current = appendEvent(sessionRef.current, 'WORDS_CLEARED', { words }, Date.now());
    saveSession(sessionRef.current);
  }

  function recordGravity() {
    if (!sessionRef.current) return;
    sessionRef.current = appendEvent(sessionRef.current, 'GRAVITY', {}, Date.now());
    saveSession(sessionRef.current);
  }

  function recordWordIdentified(pendingSnapshot) {
    if (!sessionRef.current) return;
    sessionRef.current = appendEvent(sessionRef.current, 'WORD_IDENTIFIED', { words: pendingSnapshot }, Date.now());
    saveSession(sessionRef.current);
  }

  /** Called when the game ends or reaches a stable rest point. Returns the completed session. */
  function onGameOver(state) {
    if (!sessionRef.current) return null;
    let session = setCheckpoint(sessionRef.current, state);
    session = completeSession(session);
    sessionRef.current = session;
    saveSession(session);
    saveReplaySession(session);
    return session;
  }

  /** Replace the in-memory session and persist (used by undo). */
  function replaceSession(session) {
    sessionRef.current = session;
    saveSession(session);
  }

  function getSavedSession() {
    return sessionRef.current;
  }

  function loadSavedSession() {
    const session = loadSession();
    if (session) sessionRef.current = session;
    return session;
  }

  function clearSavedSession() {
    sessionRef.current = null;
    clearSession();
  }

  function getLoadPayload() {
    if (!sessionRef.current) return null;
    return buildLoadPayload(sessionRef.current);
  }

  return {
    onGameStart,
    recordDrop,
    recordClear,
    recordGravity,
    recordWordIdentified,
    onGameOver,
    replaceSession,
    getSavedSession,
    loadSavedSession,
    clearSavedSession,
    getLoadPayload,
  };
}
