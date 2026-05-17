/**
 * Pure replay engine: reconstruct game states from an event log.
 * No React, no side effects. Maps session events to gameReducer calls.
 *
 * Three event types:
 *   DROP_LETTER  — player dropped a letter into a column
 *   WORDS_CLEARED — a batch of intersecting words was removed
 *   GRAVITY      — tiles compacted downward after a clear
 */

import { gameReducer, initialState } from '../context/GameReducer.js';
import { GRID_SIZE } from '../utils/gameConstants.js';

/**
 * Apply a single session event to a game state.
 * Maps each event type 1-to-1 onto existing reducer cases.
 *
 * @param {Object} state - current game state
 * @param {Object} event - session event { type, payload }
 * @returns {Object} next game state
 */
export function replayStep(state, event) {
  switch (event.type) {
    case 'DROP_LETTER':
      return gameReducer(state, {
        type: 'DROP_LETTER',
        payload: { column: event.payload.column },
      });

    case 'WORDS_CLEARED': {
      const { words } = event.payload;
      const chainId = words[0]?.chainId;
      const comboDepth = words[0]?.comboDepth;
      return gameReducer(state, {
        type: 'REMOVE_WORDS',
        payload: { wordsToRemove: words, chainId, comboDepth },
      });
    }

    case 'GRAVITY':
      return gameReducer(state, { type: 'APPLY_GRAVITY' });

    default:
      return state;
  }
}

/**
 * Build the initial game state for a session.
 *
 * @param {Object} session
 * @returns {Object} game state after START_GAME (no events applied)
 */
function initialStateFor(session) {
  return gameReducer(initialState, {
    type: 'START_GAME',
    payload: {
      mode: session.gameMode,
      initialQueue: session.initialQueue,
      initialGrid: session.initialGrid ?? null,
      initialBlocks: session.initialBlocks ?? [],
    },
  });
}

/**
 * Replay all events (or up to a given seq) and return the resulting state.
 *
 * @param {Object} session
 * @param {number} [upToSeq] - stop after this seq (inclusive); omit for all
 * @returns {Object} game state
 */
export function replayAll(session, upToSeq) {
  let state = initialStateFor(session);
  for (const event of session.events) {
    if (upToSeq !== undefined && event.seq > upToSeq) break;
    state = replayStep(state, event);
  }
  return state;
}

/**
 * Single-pass replay that returns a Map<seq, state> for every event.
 * Also stores the initial state at key -1.
 * Use this in the replay UI to avoid repeated full replays.
 *
 * @param {Object} session
 * @returns {Map<number, Object>} seq → game state after that event
 */
export function buildReplayStates(session) {
  const states = new Map();
  let state = initialStateFor(session);
  states.set(-1, state);
  for (const event of session.events) {
    state = replayStep(state, event);
    states.set(event.seq, state);
  }
  return states;
}

/**
 * Group events into turns: one DROP_LETTER + all its WORDS_CLEARED / GRAVITY events.
 *
 * @param {Object} session
 * @returns {Array<{ dropSeq, column, letter, events }>}
 */
export function buildTurns(session) {
  const turns = [];
  let current = null;

  for (const evt of session.events) {
    if (evt.type === 'DROP_LETTER') {
      if (current) turns.push(current);
      current = {
        dropSeq: evt.seq,
        column: evt.payload.column,
        letter: evt.payload.letter ?? '?',
        events: [evt],
      };
    } else if (current) {
      current.events.push(evt);
    }
  }
  if (current) turns.push(current);
  return turns;
}

/**
 * Return a grid with the cells from a WORDS_CLEARED event highlighted (isMatched=true).
 * Used by the replay UI to show which cells were about to be cleared.
 *
 * @param {Object} statesMap - output of buildReplayStates
 * @param {Object} clearEvent - a WORDS_CLEARED event
 * @returns {Array} 42-cell grid with matched cells flagged
 */
export function preClearGrid(statesMap, clearEvent) {
  // seq values are dense 0-indexed integers (guaranteed by appendEvent), so seq-1
  // is always the state after the immediately preceding event, or -1 for the initial state.
  const preState = statesMap.get(clearEvent.seq - 1) ?? statesMap.get(-1);
  if (!preState) return Array(GRID_SIZE).fill(null);

  const grid = [...preState.grid];
  for (const w of clearEvent.payload.words) {
    for (const idx of w.indices) {
      if (grid[idx]) grid[idx] = { ...grid[idx], isMatched: true };
    }
  }
  return grid;
}
