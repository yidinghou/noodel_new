import markovData from '../assets/letter_markov.json';
import { rng } from './seededRandom.js';

const MAX_CONSONANTS_IN_ROW = 3;     // force a vowel after this many consecutive consonants
const MAX_GENERATION_ATTEMPTS = 100; // loop guard before falling back to a direct pick

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

// Build cumulative-weight array from a probability distribution object.
// Returns an array of { letter, cumWeight } sorted by cumulative weight.
function buildCumulativeWeights(distObj) {
  const entries = Object.entries(distObj);
  let total = 0;
  return entries.map(([letter, prob]) => {
    total += prob;
    return { letter, cumWeight: total };
  });
}

// Probability of skipping the Markov chain entirely and sampling from raw
// dictionary frequency — acts as an escape valve to prevent letter clustering.
const RANDOM_INJECTION_PROB = 0.10;

// Pre-build cumulative weight tables at module load for O(n) sampling
const startWeights = buildCumulativeWeights(markovData.start);
const frequencyWeights = buildCumulativeWeights(markovData.frequency);
const bigramWeights = {};
for (const letter of Object.keys(markovData.bigrams)) {
  bigramWeights[letter] = buildCumulativeWeights(markovData.bigrams[letter]);
}

function sampleFromWeights(cumulativeArr) {
  const total = cumulativeArr[cumulativeArr.length - 1].cumWeight;
  const rand = rng() * total;
  for (const item of cumulativeArr) {
    if (rand <= item.cumWeight) return item.letter;
  }
  return cumulativeArr[cumulativeArr.length - 1].letter;
}

// Blend up to 3 forward bigram distributions with equal weight and sample.
// 10% of the time skips Markov entirely and samples from raw dictionary
// frequency as an escape valve to prevent letter clustering.
// history is an array of the last 1–3 letter strings (most recent last).
// Falls back to start distribution when history is empty.
function getMarkovLetter(history) {
  // Random injection: occasionally sample from raw dictionary frequency.
  if (rng() < RANDOM_INJECTION_PROB) {
    return sampleFromWeights(frequencyWeights);
  }

  if (!history || history.length === 0) {
    return sampleFromWeights(startWeights);
  }

  const recent = history.slice(-3);
  const n = recent.length;

  // Blend equal-weight bigram rows from last ≤3 letters
  const letters = Object.keys(markovData.bigrams);
  let total = 0;
  const blended = {};
  for (const l of letters) blended[l] = 0;

  for (const prev of recent) {
    const row = markovData.bigrams[prev] || {};
    for (const l of letters) {
      blended[l] += (row[l] || 0) / n;
    }
  }

  const cumArr = letters.map(l => {
    total += blended[l];
    return { letter: l, cumWeight: total };
  });

  return sampleFromWeights(cumArr);
}

// Re-export for callers that use getWeightedRandomLetter() directly (e.g. clearModeUtils)
export function getWeightedRandomLetter() {
  return getMarkovLetter([]);
}

function isVowel(letter) {
  return VOWELS.has(letter);
}

function getConsonantCount(sequence) {
  let count = 0;
  for (let i = sequence.length - 1; i >= 0; i--) {
    if (isVowel(sequence[i].char)) break;
    count++;
  }
  return count;
}

// Sample next letter, enforcing:
//   1. No consecutive identical letters
//   2. Vowel required after 4 consecutive consonants
function getNextValidLetter(sequence) {
  const history = sequence.slice(-3).map(t => t.char);
  const previousLetter = history.length > 0 ? history[history.length - 1] : null;
  const consonantCount = getConsonantCount(sequence);
  const mustBeVowel = consonantCount >= 4;

  let letter;
  let attempts = 0;

  do {
    letter = getMarkovLetter(history);
    attempts++;
    const isRepeating = letter === previousLetter;
    const isInvalidConsonant = mustBeVowel && !isVowel(letter);
    if (!isRepeating && !isInvalidConsonant) return letter;
  } while (attempts < 100);

  // Forced fallback
  if (mustBeVowel) {
    const vowels = Array.from(VOWELS).filter(v => v !== previousLetter);
    return vowels[Math.floor(rng() * vowels.length)];
  }
  const consonants = 'BCDFGHJKLMNPQRSTVWXYZ'.split('').filter(c => c !== previousLetter);
  return consonants[Math.floor(rng() * consonants.length)];
}

/**
 * Generate N letters with unique IDs.
 * - No consecutive identical letters
 * - Vowel forced after 4 consecutive consonants
 * - Letter choice guided by bigram Markov model over last 3 letters
 */
export function generateLetterSequence(count) {
  const sequence = [];

  for (let i = 0; i < count; i++) {
    const char = sequence.length === 0
      ? getMarkovLetter([])
      : getNextValidLetter(sequence);

    sequence.push({ char, id: `tile-${i}`, type: 'letter' });
  }

  return sequence;
}
