/**
 * LetterGenerator Unit Tests
 */

import { LetterGenerator } from '../js/letter/LetterGenerator.js';

describe('LetterGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new LetterGenerator(100);
  });

  test('can be instantiated with letter count', () => {
    expect(generator).toBeDefined();
    expect(generator.numberOfLetters).toBe(100);
    expect(generator.generatedLetters).toEqual([]);
  });

  describe('generateLetter()', () => {
    test('returns a single uppercase letter', () => {
      const letter = generator.generateLetter();
      
      expect(letter).toMatch(/^[A-Z]$/);
    });

    test('adds letter to generatedLetters array', () => {
      const letter = generator.generateLetter();
      
      expect(generator.generatedLetters).toContain(letter);
      expect(generator.generatedLetters.length).toBe(1);
    });

    test('throws error when max letters reached', () => {
      const smallGenerator = new LetterGenerator(2);
      smallGenerator.generateLetter();
      smallGenerator.generateLetter();
      
      expect(() => smallGenerator.generateLetter()).toThrow('Maximum number of letters reached');
    });
  });

  describe('isVowel()', () => {
    test('returns true for vowels', () => {
      expect(generator.isVowel('A')).toBe(true);
      expect(generator.isVowel('E')).toBe(true);
      expect(generator.isVowel('I')).toBe(true);
      expect(generator.isVowel('O')).toBe(true);
      expect(generator.isVowel('U')).toBe(true);
    });

    test('returns false for consonants', () => {
      expect(generator.isVowel('B')).toBe(false);
      expect(generator.isVowel('C')).toBe(false);
      expect(generator.isVowel('T')).toBe(false);
      expect(generator.isVowel('Z')).toBe(false);
    });
  });

  describe('isValidLetter()', () => {
    test('first letter is always valid', () => {
      expect(generator.isValidLetter('A')).toBe(true);
      expect(generator.isValidLetter('Z')).toBe(true);
    });

    test('rejects 3 consecutive same letters', () => {
      generator.generatedLetters = ['A', 'A'];
      
      expect(generator.isValidLetter('A')).toBe(false);
      expect(generator.isValidLetter('B')).toBe(true);
    });

    test('rejects 3 consecutive vowels', () => {
      generator.generatedLetters = ['A', 'E'];
      
      expect(generator.isValidLetter('I')).toBe(false);
      expect(generator.isValidLetter('T')).toBe(true);
    });

    test('rejects 3 consecutive consonants', () => {
      generator.generatedLetters = ['B', 'C'];
      
      expect(generator.isValidLetter('D')).toBe(false);
      expect(generator.isValidLetter('A')).toBe(true);
    });

    test('allows alternating vowels and consonants', () => {
      generator.generatedLetters = ['A', 'B'];
      
      expect(generator.isValidLetter('E')).toBe(true);
      expect(generator.isValidLetter('C')).toBe(true);
    });
  });

  describe('getWeightedRandomLetter()', () => {
    test('returns a valid letter', () => {
      const letter = generator.getWeightedRandomLetter();
      
      expect(letter).toMatch(/^[A-Z]$/);
    });

    test('returns letters from frequency table', () => {
      const validLetters = generator.letterFrequencies.map(f => f.letter);
      const letter = generator.getWeightedRandomLetter();
      
      expect(validLetters).toContain(letter);
    });
  });

  describe('forceValidLetter()', () => {
    test('returns a valid letter when constraints are tight', () => {
      generator.generatedLetters = ['A', 'A'];
      
      const letter = generator.forceValidLetter();
      
      expect(generator.isValidLetter(letter)).toBe(true);
    });

    test('returns high frequency letter when possible', () => {
      // First letter should be E (highest frequency) if valid
      const letter = generator.forceValidLetter();
      
      expect(letter).toBe('E');
    });
  });

  describe('utility methods', () => {
    test('generateAllLetters() generates all letters', () => {
      const smallGenerator = new LetterGenerator(10);
      const letters = smallGenerator.generateAllLetters();
      
      expect(letters.length).toBe(10);
      letters.forEach(letter => {
        expect(letter).toMatch(/^[A-Z]$/);
      });
    });

    test('getGeneratedLetters() returns copy of array', () => {
      generator.generateLetter();
      generator.generateLetter();
      
      const letters = generator.getGeneratedLetters();
      letters.push('Z'); // Modify the copy
      
      expect(generator.generatedLetters.length).toBe(2);
    });

    test('reset() clears generated letters', () => {
      generator.generateLetter();
      generator.generateLetter();
      generator.reset();
      
      expect(generator.generatedLetters).toEqual([]);
    });

    test('getRemainingCount() returns correct count', () => {
      expect(generator.getRemainingCount()).toBe(100);
      
      generator.generateLetter();
      expect(generator.getRemainingCount()).toBe(99);
      
      generator.generateLetter();
      expect(generator.getRemainingCount()).toBe(98);
    });
  });

  describe('frequency distribution', () => {
    test('high frequency letters appear more often than low frequency', () => {
      // Generate many letters to test distribution
      const largeGenerator = new LetterGenerator(1000);
      const letters = largeGenerator.generateAllLetters();
      
      // Count occurrences
      const counts = {};
      letters.forEach(letter => {
        counts[letter] = (counts[letter] || 0) + 1;
      });
      
      // E should appear more than Z (statistically very likely)
      // E has weight 12.70, Z has weight 0.07
      expect(counts['E'] || 0).toBeGreaterThan(counts['Z'] || 0);
    });

    test('all generated letters satisfy constraints', () => {
      const largeGenerator = new LetterGenerator(500);
      const letters = largeGenerator.generateAllLetters();
      
      for (let i = 2; i < letters.length; i++) {
        // No 3 consecutive same letters
        if (letters[i] === letters[i-1] && letters[i] === letters[i-2]) {
          fail(`Found 3 consecutive ${letters[i]} at index ${i}`);
        }
        
        // No 3 consecutive vowels or consonants
        const isVowel = (l) => ['A', 'E', 'I', 'O', 'U'].includes(l);
        const v1 = isVowel(letters[i]);
        const v2 = isVowel(letters[i-1]);
        const v3 = isVowel(letters[i-2]);
        
        if (v1 && v2 && v3) {
          fail(`Found 3 consecutive vowels at index ${i}`);
        }
        if (!v1 && !v2 && !v3) {
          fail(`Found 3 consecutive consonants at index ${i}`);
        }
      }
    });
  });
});
