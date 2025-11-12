import { CONFIG } from './config.js';

/**
 * WordResolver class - Detects and validates words on the game grid
 */
export class WordResolver {
    constructor(gameState, domCache) {
        this.gameState = gameState;
        this.dom = domCache;
        this.dictionary = this.initializeDictionary();
    }

    /**
     * Initialize a basic dictionary of valid words (3+ letters)
     * Can be expanded with a larger word list
     */
    initializeDictionary() {
        return new Set([
            // Common 3-letter words
            'CAT', 'DOG', 'BAT', 'RAT', 'HAT', 'MAT', 'SAT', 'FAT', 'PAT', 'VAT',
            'BIG', 'DIG', 'FIG', 'PIG', 'WIG', 'JIG', 'RIG', 'GIG',
            'CAR', 'BAR', 'JAR', 'TAR', 'WAR', 'FAR', 'PAR', 'GAR',
            'BED', 'RED', 'LED', 'FED', 'WED',
            'CAN', 'BAN', 'FAN', 'MAN', 'PAN', 'RAN', 'TAN', 'VAN', 'WAN',
            'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER',
            'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW',
            'ITS', 'MAY', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY',
            'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE',
            'BIG', 'BOX', 'RUN', 'SUN', 'TOP', 'TRY', 'WIN', 'YES',
            
            // Common 4-letter words
            'WORD', 'GAME', 'PLAY', 'TIME', 'YEAR', 'WORK', 'BACK', 'CALL', 'CAME',
            'COME', 'MAKE', 'TAKE', 'WANT', 'GIVE', 'GOOD', 'HAND', 'HIGH', 'KEEP',
            'LAST', 'LEFT', 'LIFE', 'LIKE', 'LONG', 'LOOK', 'MADE', 'MANY', 'MORE',
            'MOST', 'MOVE', 'MUCH', 'NAME', 'NEED', 'NEXT', 'ONLY', 'OVER', 'PART',
            'SAME', 'SEEM', 'SUCH', 'TELL', 'THAN', 'THAT', 'THEM', 'THEN', 'THEY',
            'THIS', 'TURN', 'VERY', 'WELL', 'WENT', 'WERE', 'WHAT', 'WHEN', 'WITH',
            'ALSO', 'AREA', 'AWAY', 'BEST', 'BOTH', 'CASE', 'CITY', 'DOWN', 'EACH',
            'EVEN', 'FEEL', 'FIND', 'FORM', 'FROM', 'HAVE', 'HERE', 'HOME', 'INTO',
            'JUST', 'KNOW', 'LATE', 'LESS', 'LINE', 'LIVE', 'MEAN', 'NEAR', 'OPEN',
            'ONCE', 'PLAN', 'REAL', 'SAID', 'SHOW', 'SOME', 'SOON', 'SURE', 'TAKE',
            'TEAM', 'THAT', 'TOLD', 'USED', 'WAIT', 'WEEK', 'WENT', 'WILL', 'YOUR',
            
            // Common 5-letter words
            'ABOUT', 'ABOVE', 'AFTER', 'AGAIN', 'ALONG', 'AMONG', 'BELOW', 'BEING',
            'BLACK', 'BREAK', 'BRING', 'BUILD', 'CARRY', 'CAUSE', 'CHECK', 'CHILD',
            'CLASS', 'CLEAR', 'CLOSE', 'COULD', 'COVER', 'DOING', 'EARLY', 'ENTER',
            'EVERY', 'FIELD', 'FIRST', 'FORCE', 'FOUND', 'GIVEN', 'GOING', 'GREAT',
            'GREEN', 'GROUP', 'HAPPY', 'HEART', 'HOUSE', 'LATER', 'LARGE', 'LEAST',
            'LEAVE', 'LIGHT', 'LITTLE', 'LOCAL', 'MIGHT', 'MONEY', 'MONTH', 'NEVER',
            'NIGHT', 'NORTH', 'OFTEN', 'ORDER', 'OTHER', 'PARTY', 'PEACE', 'PLACE',
            'PLANT', 'POINT', 'POWER', 'PRESS', 'QUITE', 'READY', 'RIGHT', 'ROUND',
            'SEEMS', 'SHALL', 'SHORT', 'SINCE', 'SMALL', 'SOUND', 'SOUTH', 'SPACE',
            'SPEAK', 'SPEND', 'STAND', 'START', 'STATE', 'STILL', 'STORY', 'STUDY',
            'THEIR', 'THERE', 'THESE', 'THING', 'THINK', 'THREE', 'TODAY', 'UNDER',
            'UNTIL', 'USING', 'VALUE', 'WATCH', 'WATER', 'WHERE', 'WHILE', 'WHITE',
            'WHOLE', 'WOMAN', 'WORLD', 'WOULD', 'WRITE', 'YEARS', 'YOUNG',
            
            // 6+ letter words
            'BEFORE', 'BETTER', 'CHANGE', 'DURING', 'ENOUGH', 'FAMILY', 'FRIEND',
            'MEMBER', 'NUMBER', 'PEOPLE', 'PERSON', 'PLEASE', 'PROBLEM', 'REASON',
            'SCHOOL', 'SECOND', 'SHOULD', 'SYSTEM', 'THROUGH', 'NOODEL', 'LETTER',
            'ALWAYS', 'AROUND', 'BECAME', 'BECOME', 'BEFORE', 'BEHIND', 'CALLED',
            'COMING', 'COURSE', 'DURING', 'ENOUGH', 'FATHER', 'FOLLOW', 'GROUND',
            'HAVING', 'ISLAND', 'ITSELF', 'MAKING', 'MATTER', 'MOTHER', 'MOVING',
            'RATHER', 'REALLY', 'RESULT', 'SAYING', 'SECOND', 'SHOULD', 'SIMPLE',
            'SINGLE', 'SOCIAL', 'STRONG', 'TAKING', 'THINGS', 'TOWARD', 'TRYING',
            'TURNED', 'UNLESS', 'WANTED', 'WITHIN', 'WONDER', 'WORKING', 'WRITING'
        ]);
    }

    /**
     * Check the entire grid for words after a letter is placed
     * Returns an array of found words with their positions
     */
    checkForWords() {
        const foundWords = [];
        
        // Check horizontal words
        foundWords.push(...this.checkHorizontal());
        
        // Check vertical words
        foundWords.push(...this.checkVertical());
        
        // Check diagonal words (both directions)
        foundWords.push(...this.checkDiagonals());
        
        return foundWords;
    }

    /**
     * Check for horizontal words (left to right)
     */
    checkHorizontal() {
        const words = [];
        
        for (let row = 0; row < CONFIG.GRID.ROWS; row++) {
            for (let col = 0; col < CONFIG.GRID.COLUMNS; col++) {
                // Try words of different lengths starting from this position
                for (let length = 3; length <= CONFIG.GRID.COLUMNS - col; length++) {
                    const wordData = this.extractWord(row, col, 0, 1, length);
                    if (wordData && this.dictionary.has(wordData.word)) {
                        words.push(wordData);
                    }
                }
            }
        }
        
        return this.filterOverlappingWords(words);
    }

    /**
     * Check for vertical words (top to bottom)
     */
    checkVertical() {
        const words = [];
        
        for (let col = 0; col < CONFIG.GRID.COLUMNS; col++) {
            for (let row = 0; row < CONFIG.GRID.ROWS; row++) {
                // Try words of different lengths starting from this position
                for (let length = 3; length <= CONFIG.GRID.ROWS - row; length++) {
                    const wordData = this.extractWord(row, col, 1, 0, length);
                    if (wordData && this.dictionary.has(wordData.word)) {
                        words.push(wordData);
                    }
                }
            }
        }
        
        return this.filterOverlappingWords(words);
    }

    /**
     * Check for diagonal words (both directions)
     */
    checkDiagonals() {
        const words = [];
        
        // Diagonal down-right
        for (let row = 0; row < CONFIG.GRID.ROWS; row++) {
            for (let col = 0; col < CONFIG.GRID.COLUMNS; col++) {
                const maxLength = Math.min(
                    CONFIG.GRID.ROWS - row,
                    CONFIG.GRID.COLUMNS - col
                );
                for (let length = 3; length <= maxLength; length++) {
                    const wordData = this.extractWord(row, col, 1, 1, length);
                    if (wordData && this.dictionary.has(wordData.word)) {
                        words.push(wordData);
                    }
                }
            }
        }
        
        // Diagonal up-right (starting from bottom rows, moving up-right)
        for (let row = 0; row < CONFIG.GRID.ROWS; row++) {
            for (let col = 0; col < CONFIG.GRID.COLUMNS; col++) {
                const maxLength = Math.min(
                    row + 1,  // Can go up from current row
                    CONFIG.GRID.COLUMNS - col  // Can go right from current column
                );
                for (let length = 3; length <= maxLength; length++) {
                    const wordData = this.extractWord(row, col, -1, 1, length);
                    if (wordData && this.dictionary.has(wordData.word)) {
                        words.push(wordData);
                    }
                }
            }
        }
        
        return this.filterOverlappingWords(words);
    }

    /**
     * Extract a word from the grid at the specified position and direction
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {number} rowDelta - Row direction (0, 1, or -1)
     * @param {number} colDelta - Column direction (0, 1, or -1)
     * @param {number} length - Length of word to extract
     * @returns {object|null} Word data object or null if invalid
     */
    extractWord(row, col, rowDelta, colDelta, length) {
        let word = '';
        const positions = [];
        
        for (let i = 0; i < length; i++) {
            const currentRow = row + (i * rowDelta);
            const currentCol = col + (i * colDelta);
            const index = currentRow * CONFIG.GRID.COLUMNS + currentCol;
            const square = this.dom.getGridSquare(index);
            
            if (!square || !square.classList.contains('filled')) {
                return null; // Empty cell or out of bounds
            }
            
            word += square.textContent;
            positions.push({ row: currentRow, col: currentCol, index });
        }
        
        return {
            word,
            positions,
            direction: this.getDirectionName(rowDelta, colDelta)
        };
    }

    /**
     * Get human-readable direction name
     */
    getDirectionName(rowDelta, colDelta) {
        if (rowDelta === 0 && colDelta === 1) return 'horizontal';
        if (rowDelta === 1 && colDelta === 0) return 'vertical';
        if (rowDelta === 1 && colDelta === 1) return 'diagonal-down-right';
        if (rowDelta === -1 && colDelta === 1) return 'diagonal-up-right';
        return 'unknown';
    }

    /**
     * Filter overlapping words - keep only the longest word from overlapping sets
     */
    filterOverlappingWords(words) {
        if (words.length === 0) return words;
        
        // Sort by length (longest first)
        words.sort((a, b) => b.word.length - a.word.length);
        
        const filtered = [];
        const usedPositions = new Set();
        
        for (const wordData of words) {
            // Check if any position is already used
            const hasOverlap = wordData.positions.some(pos => 
                usedPositions.has(`${pos.row},${pos.col}`)
            );
            
            if (!hasOverlap) {
                filtered.push(wordData);
                // Mark positions as used
                wordData.positions.forEach(pos => {
                    usedPositions.add(`${pos.row},${pos.col}`);
                });
            }
        }
        
        return filtered;
    }
}
