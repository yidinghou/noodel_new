import { loadReplaySession } from '../services/sessionStorage.js';
import { buildTurns, buildReplayStates, preClearGrid } from '../services/replayEngine.js';

function loadReplaySession() {
  // Check for a leaderboard-triggered replay first (single-use).
  try {
    const stored = localStorage.getItem('noodel_replay_session');
    if (stored) {
      localStorage.removeItem('noodel_replay_session');
      const session = JSON.parse(stored);
      if (session?.sessionId && session?.events) return session;
    }
  } catch {}
  return loadSession();
}

/**
 * Load the saved session and build all replay data in a single pass.
 *
 * Returns:
 *   session   - raw session document (or null)
 *   turns     - array of { dropSeq, column, letter, events }
 *   statesMap - Map<seq, gameState> for every event (seq -1 = initial)
 *   preClear  - (clearEvent) => 42-cell grid with matched cells flagged
 */
export function useReplaySession() {
  const session = loadReplaySession();

  if (!session || !session.events?.length) {
    return { session, turns: [], statesMap: new Map(), preClear: () => [] };
  }

  const turns = buildTurns(session);
  const statesMap = buildReplayStates(session);
  const preClear = (clearEvent) => preClearGrid(statesMap, clearEvent);

  return { session, turns, statesMap, preClear };
}
