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
function getWeightedRandomLetter() {
  const random = Math.random() * totalWeight;
  for (const item of cumulativeWeights) {
    if (random <= item.cumWeight) {
      return item.letter;
    }
  }
  return 'E'; // Fallback
}

/**
 * Generate N letters with unique IDs
 */
export function generateLetterSequence(count) {
  return Array.from({ length: count }, (_, i) => ({
    char: getWeightedRandomLetter(),
    id: `tile-${i}`,
    type: 'letter'
  }));
}
