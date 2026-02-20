import { useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { useDictionary } from './useDictionary.js';
import { findWords, filterOverlappingWords } from '../utils/wordUtils.js';
import {
  generateWordKey,
  hasIntersection,
  classifyIncomingWord,
} from '../utils/gracePeriodUtils.js';

const GRACE_PERIOD_MS = 1000;
const SHAKE_DURATION_MS = 400;
const GRAVITY_DELAY_MS = 150;

export function useGameLogic() {
  const { state, dispatch } = useGame();
  const { dictionary } = useDictionary();

  // Map<wordKey, { wordData, timerId, idxSet }>
  const pendingRef = useRef(new Map());

  // Called when a word's grace period expires
  // Cancels all other pending timers (gravity shifts positions, so re-detect fresh)
  // then shakes → removes → gravity
  const expireWord = useCallback(
    (wordKey) => {
      const pending = pendingRef.current;
      if (!pending.has(wordKey)) return;

      // Collect all pending entries before clearing
      const allPending = [...pending.values()];

      // Cancel every pending timer
      for (const entry of allPending) clearTimeout(entry.timerId);
      pending.clear();

      // Gather all unique cell indices across all pending words
      const allIndices = [...new Set(allPending.flatMap(e => e.wordData.indices))];

      // Shake phase: mark as matched (pauses word detection)
      dispatch({ type: 'SET_MATCHED_INDICES', payload: { indices: allIndices } });

      setTimeout(() => {
        // Remove all pending words and score them
        dispatch({
          type: 'REMOVE_WORDS',
          payload: { wordsToRemove: allPending.map(e => e.wordData) },
        });

        setTimeout(() => {
          dispatch({ type: 'APPLY_GRAVITY' });
        }, GRAVITY_DELAY_MS);
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
    }
  }, [state.status]);

  // Main word detection effect — runs after every grid change
  useEffect(() => {
    if (!dictionary || state.status !== 'PLAYING') return;

    const foundWords = filterOverlappingWords(findWords(state.grid, dictionary));
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
        dispatch({ type: 'CLEAR_PENDING', payload: { indices: old.wordData.indices } });
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
      dispatch({ type: 'SET_PENDING', payload: { indices: wordData.indices } });
      const timerId = setTimeout(() => expireWord(wordKey), GRACE_PERIOD_MS);
      pending.set(wordKey, { wordData, timerId, idxSet: newIdxSet });
    }
  }, [state.grid, state.status, dictionary, dispatch, expireWord]);

  return { dictionary };
}
