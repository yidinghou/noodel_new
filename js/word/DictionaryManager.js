/**
 * DictionaryManager class - Loads and manages word dictionaries from CSV files
 */
export class DictionaryManager {
    /**
     * Load all word list CSV files and combine into a single dictionary Map
     * @returns {Promise<Map<string, string>>} A Map with word->definition pairs
     */
    static async loadDictionaries() {
        const files = [
            'word_list/3_letter_words.csv',
            'word_list/4_letter_words.csv',
            'word_list/5_letter_words.csv',
            'word_list/6_letter_words.csv',
            'word_list/7_letter_words.csv'
        ];
        
        const dictionary = new Map();
        let totalLoaded = 0;
        let totalFailed = 0;
        
        for (const file of files) {
            try {
                const wordDefs = await this.loadWordFile(file);
                wordDefs.forEach(({ word, definition }) => {
                    dictionary.set(word.toUpperCase().trim(), definition.trim());
                });
                totalLoaded += wordDefs.length;
                console.log(`✓ Loaded ${wordDefs.length} words from ${file}`);
            } catch (error) {
                console.warn(`✗ Failed to load ${file}:`, error.message);
                totalFailed++;
            }
        }
        
        console.log(`Dictionary loaded: ${dictionary.size} unique words from ${files.length - totalFailed}/${files.length} files`);
        
        if (dictionary.size === 0) {
            throw new Error('Failed to load any words from dictionary files');
        }
        
        return dictionary;
    }
    
    /**
     * Load a single CSV word file and parse it
     * CSV format expected: word,definition
     * @param {string} filepath - Path to the CSV file
     * @returns {Promise<Array>} Array of {word, definition} objects
     */
    static async loadWordFile(filepath) {
        const response = await fetch(filepath);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        const lines = text.split(/\r?\n/);
        const wordDefs = [];
        
        // Skip header row (first line: "word,definition")
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Skip empty lines
            
            // Extract word (first column before comma) and definition (rest after comma)
            const commaIndex = line.indexOf(',');
            if (commaIndex > 0) {
                const word = line.substring(0, commaIndex).trim();
                const definition = line.substring(commaIndex + 1).trim();
                if (word) {
                    wordDefs.push({ word, definition });
                }
            }
        }
        
        return wordDefs;
    }
}
