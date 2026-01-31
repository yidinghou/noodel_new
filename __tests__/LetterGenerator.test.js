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
});
