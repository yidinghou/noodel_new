/**
 * WordItem class - Represents a word found in the game with its metadata
 */
export class WordItem {
    constructor(text, definition, points) {
        this.text = text;
        this.definition = definition;
        this.points = points;
    }
}
