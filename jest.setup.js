/**
 * Jest Setup File
 * Runs before each test file
 */

// Extend Jest matchers if needed in the future
// import '@testing-library/jest-dom';

// Mock CSS variables that animations depend on
Object.defineProperty(document.documentElement, 'style', {
  value: {
    getPropertyValue: () => '300',
    setProperty: () => {}
  }
});

// Mock window.getComputedStyle for animation timing
window.getComputedStyle = () => ({
  getPropertyValue: () => '300'
});

// Suppress console noise during tests (optional - comment out for debugging)
// global.console = {
//   ...console,
//   log: () => {},
//   debug: () => {},
//   info: () => {},
// };
