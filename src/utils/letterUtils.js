import { rng } from './seededRandom.js';

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
  { letter: 'Z', weight: 0.07 },
];

let totalWeight = 0;
const cumulativeWeights = LETTER_FREQUENCIES.map(item => {
  totalWeight += item.weight;
  return { letter: item.letter, cumWeight: totalWeight };
});

const MAX_CONSONANTS_IN_ROW = 3;
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

export function getWeightedRandomLetter() {
  const rand = rng() * totalWeight;
  for (const item of cumulativeWeights) {
    if (rand <= item.cumWeight) return item.letter;
  }
  return 'E';
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

function getNextValidLetter(sequence) {
  const previousLetter = sequence.length > 0 ? sequence[sequence.length - 1].char : null;
  const consonantCount = getConsonantCount(sequence);
  const mustBeVowel = consonantCount >= MAX_CONSONANTS_IN_ROW;

  let letter;
  let attempts = 0;
  do {
    letter = getWeightedRandomLetter();
    attempts++;
    if (letter !== previousLetter && !(mustBeVowel && !isVowel(letter))) return letter;
  } while (attempts < 100);

  if (mustBeVowel) {
    const vowels = Array.from(VOWELS).filter(v => v !== previousLetter);
    return vowels[Math.floor(rng() * vowels.length)];
  }
  const consonants = 'BCDFGHJKLMNPQRSTVWXYZ'.split('').filter(c => c !== previousLetter);
  return consonants[Math.floor(rng() * consonants.length)];
}

export function generateLetterSequence(count) {
  const sequence = [];
  for (let i = 0; i < count; i++) {
    const char = sequence.length === 0
      ? getWeightedRandomLetter()
      : getNextValidLetter(sequence);
    sequence.push({ char, id: `tile-${i}`, type: 'letter' });
  }
  return sequence;
}
