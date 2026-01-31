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
});
