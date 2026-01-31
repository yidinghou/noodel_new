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

    test('returns false for NaN column', () => {
      expect(isValidColumn(NaN, 7)).toBe(false);
    });

    // Edge cases for invalid columns parameter
    test('returns false when columns is 0', () => {
      expect(isValidColumn(0, 0)).toBe(false);
    });

    test('returns false when columns is negative', () => {
      expect(isValidColumn(3, -1)).toBe(false);
    });

    test('returns false when columns is NaN', () => {
      expect(isValidColumn(3, NaN)).toBe(false);
    });

    test('returns false when columns is non-integer', () => {
      expect(isValidColumn(1, 2.5)).toBe(false);
    });

    test('returns false for non-integer column', () => {
      expect(isValidColumn(1.5, 7)).toBe(false);
    });
  });

  describe('calculateIndex() - edge cases', () => {
    test('returns -1 when columns is 0', () => {
      expect(calculateIndex(0, 0, 0)).toBe(-1);
    });

    test('returns -1 when columns is negative', () => {
      expect(calculateIndex(0, 0, -1)).toBe(-1);
    });

    test('returns -1 for negative row', () => {
      expect(calculateIndex(-1, 0, 7)).toBe(-1);
    });

    test('returns -1 for negative col', () => {
      expect(calculateIndex(0, -1, 7)).toBe(-1);
    });

    test('returns -1 for non-integer inputs', () => {
      expect(calculateIndex(1.5, 2, 7)).toBe(-1);
    });
  });

  describe('calculateRowCol() - edge cases', () => {
    test('returns null when columns is 0', () => {
      expect(calculateRowCol(0, 0)).toBeNull();
    });

    test('returns null when columns is negative', () => {
      expect(calculateRowCol(0, -1)).toBeNull();
    });

    test('returns null for negative index', () => {
      expect(calculateRowCol(-1, 7)).toBeNull();
    });

    test('returns null for non-integer index', () => {
      expect(calculateRowCol(1.5, 7)).toBeNull();
    });
  });
});
