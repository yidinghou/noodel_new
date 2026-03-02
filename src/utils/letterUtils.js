// Letter frequency weights based on English language usage
const LETTER_FREQUENCIES = [
  { letter: 'E', weight: 12.70 },
  { letter: 'T', weight: 9.06 },
  { letter: 'A', weight: 8.17 },
  { letter: 'O', weight: 7.51 },
  { letter: 'I', weight: 6.97 },
  { letter: 'N', weight: 6.75 },
  { letter: 'S', weight: 6.33 },
  { letter: 'H', weight: 6.09 },
  { letter: 'R', weight: 5.99 },
  { letter: 'D', weight: 4.25 },
  { letter: 'L', weight: 4.03 },
  { letter: 'C', weight: 2.78 },
  { letter: 'U', weight: 2.76 },
  { letter: 'M', weight: 2.41 },
  { letter: 'W', weight: 2.36 },
  { letter: 'F', weight: 2.23 },
  { letter: 'G', weight: 2.02 },
  { letter: 'Y', weight: 1.97 },
  { letter: 'P', weight: 1.93 },
  { letter: 'B', weight: 1.29 },
  { letter: 'V', weight: 0.98 },
  { letter: 'K', weight: 0.77 },
  { letter: 'J', weight: 0.15 },
  { letter: 'X', weight: 0.15 },
  { letter: 'Q', weight: 0.10 },
  { letter: 'Z', weight: 0.07 }
];

// Calculate cumulative weights once
let totalWeight = 0;
const cumulativeWeights = LETTER_FREQUENCIES.map(item => {
  totalWeight += item.weight;
  return { letter: item.letter, cumWeight: totalWeight };
});

/**
 * Generate a weighted random letter
 */
export function getWeightedRandomLetter() {
  const random = Math.random() * totalWeight;
  for (const item of cumulativeWeights) {
    if (random <= item.cumWeight) {
      return item.letter;
    }
  }
  return 'E'; // Fallback
}

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

function isVowel(letter) {
  return VOWELS.has(letter);
}

function getConsonantCount(letters) {
  // Count consecutive consonants from the end
  let count = 0;
  for (let i = letters.length - 1; i >= 0; i--) {
    if (isVowel(letters[i].char)) {
      break;
    }
    count++;
  }
  return count;
}

/**
 * Get next letter with constraints:
 * 1. No letter repeating consecutively
 * 2. No more than 3 consonants in a row
 */
function getNextValidLetter(previousLetter, consonantCount) {
  // If we have 3 consonants, must pick a vowel
  const mustBeVowel = consonantCount >= 3;

  let letter;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    letter = getWeightedRandomLetter();
    attempts++;

    // Check constraints
    const isRepeating = letter === previousLetter;
    const isInvalidConsonant = mustBeVowel && !isVowel(letter);

    if (!isRepeating && !isInvalidConsonant) {
      return letter;
    }
  } while (attempts < maxAttempts);

  // Fallback: if we exhausted attempts, pick a valid letter directly
  if (mustBeVowel) {
    return Array.from(VOWELS)[Math.floor(Math.random() * VOWELS.size)];
  }

  // Just pick something that's not the previous letter
  const consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
  const valid = consonants.filter(c => c !== previousLetter);
  return valid[Math.floor(Math.random() * valid.length)];
}

/**
 * Generate N letters with unique IDs
 * - No consecutive repeated letters
 * - No more than 3 consecutive consonants
 */
export function generateLetterSequence(count) {
  const sequence = [];

  for (let i = 0; i < count; i++) {
    const previousLetter = sequence.length > 0 ? sequence[sequence.length - 1].char : null;
    const consonantCount = getConsonantCount(sequence);

    const letter = previousLetter
      ? getNextValidLetter(previousLetter, consonantCount)
      : getWeightedRandomLetter();

    sequence.push({
      char: letter,
      id: `tile-${i}`,
      type: 'letter'
    });
  }

  return sequence;
}
