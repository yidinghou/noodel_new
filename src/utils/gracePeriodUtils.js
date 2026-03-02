/**
 * Pure functions for the grace period state machine.
 * Extracted from useGameLogic so they can be unit-tested without React.
 */

export function generateWordKey(wordData) {
  return `${wordData.word}_${wordData.direction}_${wordData.startRow}_${wordData.startCol}`;
}

// True if newIdxSet is a strict superset of oldIdxSet (i.e. the new word contains
// all cells of the old word plus at least one extra cell).
export function isExtension(newIdxSet, oldIdxSet) {
  if (newIdxSet.size <= oldIdxSet.size) return false;
  for (const idx of oldIdxSet) {
    if (!newIdxSet.has(idx)) return false;
  }
  return true;
}

// True if the two index sets share at least one cell.
export function hasIntersection(setA, setB) {
  for (const idx of setA) {
    if (setB.has(idx)) return true;
  }
  return false;
}

/**
 * Classify how a newly detected word should interact with the current pending set.
 *
 * @param {Object} wordData - Newly detected word ({ word, direction, startRow, startCol, indices })
 * @param {Map<string, { direction: string, idxSet: Set<number> }>} pendingEntries
 *   A view of the pending map containing only the fields needed for classification.
 *
 * @returns one of:
 *   { type: 'skip' }
 *     The exact same word key is already pending — nothing to do.
 *
 *   { type: 'extend', replaceKey: string }
 *     The new word is a strict superset of an existing same-direction pending word.
 *     The caller should remove `replaceKey` and add the new word with a fresh timer.
 *
 *   { type: 'add', resetKeys: string[] }
 *     A genuinely new word. The caller should start a new grace-period timer for it
 *     and also reset the timers of every key in `resetKeys` (words that share cells
 *     with the new word, in any direction).
 */
export function classifyIncomingWord(wordData, pendingEntries) {
  const newIdxSet = new Set(wordData.indices);
  const wordKey = generateWordKey(wordData);

  // Already pending with the same key — stable state, no action needed
  if (pendingEntries.has(wordKey)) {
    return { type: 'skip' };
  }

  // Check for extension: new word grows an existing same-direction pending word
  for (const [key, entry] of pendingEntries) {
    if (entry.direction === wordData.direction && isExtension(newIdxSet, entry.idxSet)) {
      return { type: 'extend', replaceKey: key };
    }
  }

  // New word — collect all pending words that share any cell (any direction)
  // so the caller can reset their timers alongside starting this word's timer.
  const resetKeys = [];
  for (const [key, entry] of pendingEntries) {
    if (hasIntersection(newIdxSet, entry.idxSet)) {
      resetKeys.push(key);
    }
  }

  return { type: 'add', resetKeys };
}
