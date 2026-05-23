// Records the stream of reducer actions during a game so it can be replayed,
// plus pre-drop checkpoints used for undo and mid-game resume.
// Pure module — no React, no I/O. Caller decides when to snapshot and persist.

import { A } from '../utils/actionTypes.js';

export const SESSION_SCHEMA_VERSION = 2;

// Actions that drive a visible state transition. Anything else (RESET, LOAD_SAVED_GAME)
// is not part of the gameplay timeline.
const RECORDABLE = new Set([
  A.START_GAME,
  A.DROP_LETTER,
  A.SET_PENDING,
  A.CLEAR_PENDING,
  A.SET_MATCHED_INDICES,
  A.REMOVE_WORDS,
  A.APPLY_GRAVITY,
  A.GAME_OVER,
]);

// State fields needed to fully restore the reducer via LOAD_SAVED_GAME.
const CHECKPOINT_FIELDS = ['grid', 'nextQueue', 'lettersRemaining', 'score', 'madeWords', 'gameMode', 'initialBlocks'];

function pickCheckpointState(state) {
  const out = {};
  for (const k of CHECKPOINT_FIELDS) out[k] = state[k];
  return out;
}

export function isRecordable(action) {
  return !!action && RECORDABLE.has(action.type);
}

export function createRecorder({ now = () => performance.now() } = {}) {
  let startedAt = null;
  let events = [];
  let checkpoints = [];
  let onChangeCb = null;

  function emit() {
    if (onChangeCb) onChangeCb();
  }

  return {
    record(action) {
      if (!isRecordable(action)) return;
      if (action.type === A.START_GAME) {
        startedAt = now();
        events = [];
        checkpoints = [];
      }
      if (startedAt === null) return; // ignore stray events before START_GAME
      events.push({
        t: now() - startedAt,
        type: action.type,
        payload: action.payload,
      });
      emit();
    },

    // Captures reducer state immediately before a DROP_LETTER is recorded.
    // The resulting checkpoint can be replayed via LOAD_SAVED_GAME.
    recordCheckpoint(state) {
      if (startedAt === null) return;
      checkpoints.push({
        beforeEventIndex: events.length,
        state: pickCheckpointState(state),
      });
      emit();
    },

    // Pops and returns the last checkpoint, truncating events back to that point.
    // Used by undo. Returns null when the stack is empty.
    popLastCheckpoint() {
      if (checkpoints.length === 0) return null;
      const cp = checkpoints.pop();
      events = events.slice(0, cp.beforeEventIndex);
      emit();
      return cp;
    },

    snapshot() {
      if (startedAt === null) return null;
      return {
        schemaVersion: SESSION_SCHEMA_VERSION,
        startedAt,
        events: events.slice(),
        checkpoints: checkpoints.slice(),
      };
    },

    // Rehydrate the recorder from a persisted snapshot. Used for resume.
    loadSnapshot(snapshot) {
      if (!snapshot || snapshot.schemaVersion !== SESSION_SCHEMA_VERSION) return false;
      startedAt = snapshot.startedAt ?? now();
      events = Array.isArray(snapshot.events) ? snapshot.events.slice() : [];
      checkpoints = Array.isArray(snapshot.checkpoints) ? snapshot.checkpoints.slice() : [];
      emit();
      return true;
    },

    reset() {
      startedAt = null;
      events = [];
      checkpoints = [];
      emit();
    },

    onChange(cb) {
      onChangeCb = cb;
    },
  };
}
