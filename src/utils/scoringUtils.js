/**
 * ScoringUtils - Scrabble-based scoring system with length bonuses
 */

// Scrabble letter point values
const LETTER_VALUES = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1,
    'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1,
    'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10
};

// Length bonuses (Fibonacci-like sequence)
const LENGTH_BONUSES = {
    3: 0,
    4: 1,
    5: 3,
    6: 4,
    7: 7
};

/**
 * Calculate the score for a word based on Scrabble tile values + length bonus
 * @param {string} word - The word to score
 * @returns {number} The total score
 */
export function calculateWordScore(word) {
    const upperWord = word.toUpperCase();
    
    // Calculate base score from letter values
    let baseScore = 0;
    for (let i = 0; i < upperWord.length; i++) {
        const letter = upperWord[i];
        baseScore += LETTER_VALUES[letter] || 0;
    }
    
    // Add length bonus
    const lengthBonus = LENGTH_BONUSES[word.length] || 0;
    
    return baseScore + lengthBonus;
}

/**
 * Get the point value for a single letter
 * @param {string} letter - The letter to get the value for
 * @returns {number} The point value
 */
export function getLetterValue(letter) {
    return LETTER_VALUES[letter.toUpperCase()] || 0;
}
