/**
 * Sanity test to verify Jest is working correctly
 */

describe('Jest Setup', () => {
  test('Jest is configured and running', () => {
    expect(true).toBe(true);
  });

  test('jsdom environment is available', () => {
    expect(typeof document).toBe('object');
    expect(typeof window).toBe('object');
  });

  test('can create DOM elements', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello';
    document.body.appendChild(div);
    
    expect(document.body.contains(div)).toBe(true);
    expect(div.textContent).toBe('Hello');
    
    // Cleanup
    document.body.removeChild(div);
  });

  test('ES modules work correctly', async () => {
    // This verifies that ES module imports work
    const { CONFIG } = await import('../js/config.js');
    expect(CONFIG).toBeDefined();
    expect(CONFIG.GRID).toBeDefined();
  });
});
