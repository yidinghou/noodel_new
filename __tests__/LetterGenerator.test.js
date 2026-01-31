/**
 * LetterGenerator Unit Tests
 */

import { jest } from '@jest/globals';
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
});
