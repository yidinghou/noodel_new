/**
 * LetterGenerator
 * Generates letters based on English language frequency distributions
 * with constraints to avoid repetitive patterns
 */
class LetterGenerator {
  constructor(numberOfLetters) {
    this.numberOfLetters = numberOfLetters;
    this.generatedLetters = [];
    
    // Define vowels and consonants
    this.vowels = new Set(['A', 'E', 'I', 'O', 'U']);
    
    // Letter frequency based on English language usage
    // Frequencies are approximate percentages from corpus analysis
    this.letterFrequencies = [
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
    
    // Create cumulative weights for weighted random selection
    this.cumulativeWeights = [];
    let sum = 0;
    for (const item of this.letterFrequencies) {
      sum += item.weight;
      this.cumulativeWeights.push({ letter: item.letter, cumWeight: sum });
    }
    this.totalWeight = sum;
  }
  
  /**
   * Generates a single letter following the constraints
   * @returns {string} A single uppercase letter
   */
  generateLetter() {
    if (this.generatedLetters.length >= this.numberOfLetters) {
      throw new Error('Maximum number of letters reached');
    }
    
    let letter;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      letter = this.getWeightedRandomLetter();
      attempts++;
      
      if (attempts >= maxAttempts) {
        // Fallback: force a valid letter if we can't find one randomly
        letter = this.forceValidLetter();
        break;
      }
    } while (!this.isValidLetter(letter));
    
    this.generatedLetters.push(letter);
    return letter;
  }
  
  /**
   * Selects a random letter based on weighted frequencies
   * @returns {string} A single uppercase letter
   */
  getWeightedRandomLetter() {
    const random = Math.random() * this.totalWeight;
    
    for (const item of this.cumulativeWeights) {
      if (random <= item.cumWeight) {
        return item.letter;
      }
    }
    
    // Fallback (should never reach here)
    return this.letterFrequencies[0].letter;
  }
  
  /**
   * Checks if a letter is a vowel
   * @param {string} letter - The letter to check
   * @returns {boolean} True if vowel, false otherwise
   */
  isVowel(letter) {
    return this.vowels.has(letter);
  }
  
  /**
   * Validates if a letter can be added based on constraints
   * @param {string} letter - The letter to validate
   * @returns {boolean} True if valid, false otherwise
   */
  isValidLetter(letter) {
    const len = this.generatedLetters.length;
    
    // First letter is always valid
    if (len === 0) {
      return true;
    }
    
    // Check constraint: no letter appears more than 2 times in a row
    if (len >= 2) {
      if (this.generatedLetters[len - 1] === letter && 
          this.generatedLetters[len - 2] === letter) {
        return false;
      }
    }
    
    // Check constraint: no 3 consecutive vowels or consonants
    if (len >= 2) {
      const isCurrentVowel = this.isVowel(letter);
      const isPrev1Vowel = this.isVowel(this.generatedLetters[len - 1]);
      const isPrev2Vowel = this.isVowel(this.generatedLetters[len - 2]);
      
      // All three would be vowels
      if (isCurrentVowel && isPrev1Vowel && isPrev2Vowel) {
        return false;
      }
      
      // All three would be consonants
      if (!isCurrentVowel && !isPrev1Vowel && !isPrev2Vowel) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Forces a valid letter by trying letters in order of frequency
   * Used as fallback when random selection fails repeatedly
   * @returns {string} A valid letter
   */
  forceValidLetter() {
    // Try letters in order of frequency
    for (const item of this.letterFrequencies) {
      if (this.isValidLetter(item.letter)) {
        return item.letter;
      }
    }
    
    // This should never happen, but return 'E' as absolute fallback
    return 'E';
  }
  
  /**
   * Generates all letters at once
   * @returns {string[]} Array of generated letters
   */
  generateAllLetters() {
    while (this.generatedLetters.length < this.numberOfLetters) {
      this.generateLetter();
    }
    return this.generatedLetters;
  }
  
  /**
   * Gets all generated letters so far
   * @returns {string[]} Array of generated letters
   */
  getGeneratedLetters() {
    return [...this.generatedLetters];
  }
  
  /**
   * Resets the generator
   */
  reset() {
    this.generatedLetters = [];
  }
  
  /**
   * Gets the number of letters remaining to generate
   * @returns {number} Remaining letters count
   */
  getRemainingCount() {
    return this.numberOfLetters - this.generatedLetters.length;
  }
}

// Export for ES6 modules
export { LetterGenerator };
