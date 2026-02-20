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
  // Only expires the specific word and any intersecting words
  // Independent words keep their timers and expire separately
  const expireWord = useCallback(
    (wordKey) => {
      const pending = pendingRef.current;
      if (!pending.has(wordKey)) return;

      const expiredWord = pending.get(wordKey);
      const expiredIndices = new Set(expiredWord.wordData.indices);

      // Find all words that intersect with the expired word
      const wordsToExpire = [expiredWord];
      const keysToDelete = [wordKey];

      for (const [key, entry] of pending) {
        if (key !== wordKey && hasIntersection(expiredIndices, entry.idxSet)) {
          wordsToExpire.push(entry);
          keysToDelete.push(key);
        }
      }

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

      // Shake phase: mark as matched (pauses word detection)
      dispatch({ type: 'SET_MATCHED_INDICES', payload: { indices: allIndices } });

      setTimeout(() => {
        // Remove expired words and score them
        dispatch({
          type: 'REMOVE_WORDS',
          payload: { wordsToRemove: wordsToExpire.map(e => e.wordData) },
        });

        // Only apply gravity if no other words are still pending
        // This prevents gravity from interfering with words still in their grace period
        if (pending.size === 0) {
          setTimeout(() => {
            dispatch({ type: 'APPLY_GRAVITY' });
          }, GRAVITY_DELAY_MS);
        }
      }, SHAKE_DURATION_MS);
    },
    [dispatch, hasIntersection]
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
  }, [state.grid, state.status, dictionary, dispatch, expireWord]);

  return { dictionary };
}
