/**
 * gridUtils Unit Tests
 */

import {
  calculateIndex,
  calculateRowCol,
  isValidColumn
} from '../js/grid/gridUtils.js';

describe('gridUtils', () => {
  describe('calculateIndex()', () => {
    test('calculates index for first cell', () => {
      expect(calculateIndex(0, 0, 7)).toBe(0);
    });

    test('calculates index for cell in first row', () => {
      expect(calculateIndex(0, 3, 7)).toBe(3);
    });

    test('calculates index for cell in later row', () => {
      expect(calculateIndex(2, 3, 7)).toBe(17); // 2*7 + 3
    });

    test('calculates index for last cell', () => {
      expect(calculateIndex(5, 6, 7)).toBe(41); // 5*7 + 6
    });
  });

  describe('calculateRowCol()', () => {
    test('calculates row/col for first cell', () => {
      expect(calculateRowCol(0, 7)).toEqual({ row: 0, col: 0 });
    });

    test('calculates row/col for cell in first row', () => {
      expect(calculateRowCol(3, 7)).toEqual({ row: 0, col: 3 });
    });

    test('calculates row/col for cell in later row', () => {
      expect(calculateRowCol(17, 7)).toEqual({ row: 2, col: 3 });
    });

    test('calculates row/col for last cell', () => {
      expect(calculateRowCol(41, 7)).toEqual({ row: 5, col: 6 });
    });
  });

  describe('isValidColumn()', () => {
    test('returns true for valid column', () => {
      expect(isValidColumn(3, 7)).toBe(true);
    });

    test('returns true for first column', () => {
      expect(isValidColumn(0, 7)).toBe(true);
    });

    test('returns true for last column', () => {
      expect(isValidColumn(6, 7)).toBe(true);
    });

    test('returns false for negative column', () => {
      expect(isValidColumn(-1, 7)).toBe(false);
    });

    test('returns false for column equal to max', () => {
      expect(isValidColumn(7, 7)).toBe(false);
    });

    test('returns false for NaN', () => {
      expect(isValidColumn(NaN, 7)).toBe(false);
    });
  });
});
