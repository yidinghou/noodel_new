import { useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { useDictionary } from './useDictionary.js';
import { findWords, filterOverlappingWords, hasUserGeneratedTile } from '../utils/wordUtils.js';
import {
  generateWordKey,
  hasIntersection,
  classifyIncomingWord,
} from '../utils/gracePeriodUtils.js';
import { GRID_COLS } from '../utils/gameConstants.js';

const GRACE_PERIOD_MS = 1000;
const SHAKE_DURATION_MS = 400;
const GRAVITY_DELAY_MS = 150;

export function useGameLogic() {
  const { state, dispatch } = useGame();
  const { dictionary, loading } = useDictionary();

  // Mirror state into a ref so timer callbacks can read the latest grid/score/queue
  // without forcing expireWord to re-create (which would invalidate live timers).
  const stateRef = useRef(state);
  stateRef.current = state;

  // Map<wordKey, { wordData, timerId, idxSet }>
  const pendingRef = useRef(new Map());
  // Blocks word detection during the gravity settling window
  const gravityScheduledRef = useRef(false);
  // Counts expireWord calls whose REMOVE_WORDS hasn't fired yet
  // Gravity must wait until this reaches 0 (all tiles actually cleared)
  const pendingRemovesRef = useRef(0);

  // Combo chain tracking: Map<chainId, { columns: Set<number>, depth: number }>
  // Chains accumulate across a full cascade and reset on each new player drop.
  const activeChainMapRef = useRef(new Map());
  const chainCounterRef = useRef(0);
  // Tracks lettersRemaining to detect new player drops (each drop decrements it)
  const lastLettersRef = useRef(null);

  // Called when a word's grace period expires
  // Only expires the specific word and any intersecting words
  // Independent words keep their timers and expire separately
  const expireWord = useCallback(
    (wordKey) => {
      const pending = pendingRef.current;
      if (!pending.has(wordKey)) return;

      const expiredWord = pending.get(wordKey);
      const expiredIndices = new Set(expiredWord.wordData.indices);

      // Find all words that intersect with the expired word (transitive closure via BFS).
      // If A∩B and B∩C, then A, B, C all expire together even if A∩C is empty.
      const wordsToExpire = [expiredWord];
      const visitedKeys = new Set([wordKey]);
      const queue = [expiredWord];

      while (queue.length > 0) {
        const frontier = queue.shift();
        for (const [key, entry] of pending) {
          if (!visitedKeys.has(key) && hasIntersection(frontier.idxSet, entry.idxSet)) {
            visitedKeys.add(key);
            wordsToExpire.push(entry);
            queue.push(entry);
          }
        }
      }

      const keysToDelete = [...visitedKeys];

      // Cancel timers only for words being expired
      for (const entry of wordsToExpire) {
        clearTimeout(entry.timerId);
      }

      // Remove expired words from pending map
      for (const key of keysToDelete) {
        pending.delete(key);
      }

      // Gather indices for expired words
      const allIndices = [...new Set(wordsToExpire.flatMap(e => e.wordData.indices))];

      // --- Combo chain attribution ---
      const expiredCols = new Set(allIndices.map(i => i % GRID_COLS));

      const overlapping = [...activeChainMapRef.current.entries()]
        .filter(([, chain]) => [...expiredCols].some(col => chain.columns.has(col)));

      let chainId, comboDepth;
      if (overlapping.length === 0) {
        chainId = `${Date.now()}_${++chainCounterRef.current}`;
        comboDepth = 1;
        activeChainMapRef.current.set(chainId, { columns: new Set(expiredCols), depth: 1 });
      } else {
        overlapping.sort((a, b) => b[1].depth - a[1].depth);
        const [deepestId, deepestChain] = overlapping[0];
        chainId = deepestId;
        comboDepth = deepestChain.depth + 1;
        for (const [cId, chain] of overlapping.slice(1)) {
          chain.columns.forEach(col => deepestChain.columns.add(col));
          activeChainMapRef.current.delete(cId);
        }
        expiredCols.forEach(col => deepestChain.columns.add(col));
        deepestChain.depth = comboDepth;
      }

      // Shake phase: mark as matched (pauses word detection)
      dispatch({ type: 'SET_MATCHED_INDICES', payload: { indices: allIndices } });

      pendingRemovesRef.current++;
      setTimeout(() => {
        // Remove expired words and score them
        dispatch({
          type: 'REMOVE_WORDS',
          payload: {
            wordsToRemove: wordsToExpire.map(e => e.wordData),
            chainId,
            comboDepth,
            groupSize: wordsToExpire.length,
          },
        });

        pendingRemovesRef.current--;

        // Apply gravity only when all in-flight removes have landed and no words are still
        // pending. The gravityScheduledRef guard prevents double-scheduling when multiple
        // words expire simultaneously (their REMOVE_WORDS callbacks run in the same tick).
        if (pendingRemovesRef.current === 0 && pending.size === 0 && !gravityScheduledRef.current) {
          gravityScheduledRef.current = true;
          setTimeout(() => {
            gravityScheduledRef.current = false;
            dispatch({ type: 'APPLY_GRAVITY' });
          }, GRAVITY_DELAY_MS);
        }
      }, SHAKE_DURATION_MS);
    },
    [dispatch]
  );

  // Clear all pending state when the game resets
  useEffect(() => {
    if (state.status === 'IDLE') {
      const pending = pendingRef.current;
      for (const entry of pending.values()) clearTimeout(entry.timerId);
      pending.clear();
      pendingRemovesRef.current = 0;
      gravityScheduledRef.current = false;
      activeChainMapRef.current.clear();
      lastLettersRef.current = null;
    }
  }, [state.status]);

  // Cancel in-flight grace/gravity work when the reducer rewinds (undo or resume).
  // Only LOAD_SAVED_GAME causes lettersRemaining to increase mid-game.
  useEffect(() => {
    if (
      lastLettersRef.current !== null &&
      state.lettersRemaining > lastLettersRef.current
    ) {
      const pending = pendingRef.current;
      for (const entry of pending.values()) clearTimeout(entry.timerId);
      pending.clear();
      pendingRemovesRef.current = 0;
      gravityScheduledRef.current = false;
      activeChainMapRef.current.clear();
      lastLettersRef.current = state.lettersRemaining;
    }
  }, [state.lettersRemaining]);

  // Main word detection effect — runs after every grid change
  useEffect(() => {
    if (!dictionary || state.status !== 'PLAYING' || gravityScheduledRef.current) return;

    // Detect new player drop: lettersRemaining decreases on each DROP_LETTER.
    // Clear chains synchronously before scanning so words from this drop start fresh.
    if (lastLettersRef.current !== null && state.lettersRemaining < lastLettersRef.current) {
      activeChainMapRef.current.clear();
    }
    lastLettersRef.current = state.lettersRemaining;

    // Exclude tiles that are currently shaking (isMatched=true) from detection.
    // This prevents words from being detected using about-to-be-cleared tiles while
    // still allowing extensions and timer resets for valid pending words to proceed.
    const detectionGrid = state.grid.map(tile => (tile?.isMatched ? null : tile));
    let foundWords = filterOverlappingWords(findWords(detectionGrid, dictionary));

    // Filter words for Clear mode - must have at least one user-dropped tile
    if (state.gameMode === 'clear') {
      foundWords = foundWords.filter(wordData =>
        hasUserGeneratedTile(wordData.indices, state.grid)
      );
    }

    const pending = pendingRef.current;

    for (const wordData of foundWords) {
      const wordKey = generateWordKey(wordData);

      // Build a read-only view of the pending map for pure classification
      const pendingView = new Map(
        [...pending.entries()].map(([k, e]) => [k, { direction: e.wordData.direction, idxSet: e.idxSet }])
      );
      const result = classifyIncomingWord(wordData, pendingView);

      if (result.type === 'skip') continue;

      if (result.type === 'extend') {
        // Cancel and clear the shorter word being replaced
        const old = pending.get(result.replaceKey);
        clearTimeout(old.timerId);
        dispatch({
          type: 'CLEAR_PENDING',
          payload: { indices: old.wordData.indices, direction: old.wordData.direction }
        });
        pending.delete(result.replaceKey);
      }

      // Reset timers for any remaining pending words that share cells with the new word
      // (covers both the 'add' path and the post-extend path)
      const newIdxSet = new Set(wordData.indices);
      for (const [key, entry] of pending) {
        if (hasIntersection(newIdxSet, entry.idxSet)) {
          clearTimeout(entry.timerId);
          entry.timerId = setTimeout(() => expireWord(key), GRACE_PERIOD_MS);
        }
      }

      // Start grace period for this word
      dispatch({
        type: 'SET_PENDING',
        payload: { indices: wordData.indices, direction: wordData.direction }
      });
      const timerId = setTimeout(() => expireWord(wordKey), GRACE_PERIOD_MS);
      pending.set(wordKey, { wordData, timerId, idxSet: newIdxSet });
    }
  }, [state.grid, state.status, state.gameMode, dictionary, dispatch, expireWord]);

  // Check for Clear mode victory condition
  useEffect(() => {
    if (state.gameMode !== 'clear' || state.status !== 'PLAYING') return;

    // Win requires the entire board to be empty (not just the initial block cells).
    // Player-placed tiles must also be cleared for victory to trigger.
    const gridEmpty = state.grid.every(cell => !cell);

    if (gridEmpty && state.initialBlocks.length > 0) {
      dispatch({ type: 'GAME_OVER' });
    }
  }, [state.grid, state.gameMode, state.status, state.initialBlocks, dispatch]);

  return { dictionary, loading };
}
