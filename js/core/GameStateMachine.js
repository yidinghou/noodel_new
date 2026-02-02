/**
 * GamePhase - Enumeration of all possible game phases
 * @enum {string}
 */
export const GamePhase = {
    LOADING: 'loading',
    INTRO_ANIMATION: 'intro_animation',
    START_SEQUENCE: 'start_sequence',
    GAME_READY: 'game_ready',
    PLAYING: 'playing',
    WORD_PROCESSING: 'word_processing',
    GAME_OVER: 'game_over',
    RESETTING: 'resetting'
};

/**
 * ValidTransitions - Defines which state transitions are allowed
 * @type {Object<string, string[]>}
 */
export const ValidTransitions = {
    [GamePhase.LOADING]: [GamePhase.INTRO_ANIMATION],
    [GamePhase.INTRO_ANIMATION]: [GamePhase.START_SEQUENCE],
    [GamePhase.START_SEQUENCE]: [GamePhase.GAME_READY],
    [GamePhase.GAME_READY]: [GamePhase.PLAYING],
    [GamePhase.PLAYING]: [GamePhase.WORD_PROCESSING, GamePhase.GAME_OVER],
    [GamePhase.WORD_PROCESSING]: [GamePhase.PLAYING, GamePhase.GAME_OVER],
    [GamePhase.GAME_OVER]: [GamePhase.RESETTING],
    [GamePhase.RESETTING]: [GamePhase.INTRO_ANIMATION, GamePhase.START_SEQUENCE]
};

/**
 * GameStateMachine - Manages explicit game state transitions
 * Provides type-safe state management and transition validation
 */
export class GameStateMachine {
    constructor() {
        this.currentPhase = GamePhase.LOADING;
        this.listeners = [];
    }

    /**
     * Transition to a new game phase
     * @param {string} toPhase - Target game phase
     * @throws {Error} If transition is invalid
     */
    transition(toPhase) {
        const validNext = ValidTransitions[this.currentPhase];
        
        if (!validNext || !validNext.includes(toPhase)) {
            throw new Error(`Invalid transition: ${this.currentPhase} -> ${toPhase}`);
        }
        
        const fromPhase = this.currentPhase;
        this.currentPhase = toPhase;
        
        // Notify all listeners of the transition
        this.listeners.forEach(fn => fn(fromPhase, toPhase));
        console.log(`Game phase: ${fromPhase} -> ${toPhase}`);
    }

    /**
     * Register a listener for phase transitions
     * @param {Function} callback - Called with (fromPhase, toPhase)
     */
    onTransition(callback) {
        this.listeners.push(callback);
    }

    /**
     * Check if currently in a specific phase
     * @param {string} phase - Phase to check
     * @returns {boolean}
     */
    is(phase) {
        return this.currentPhase === phase;
    }

    /**
     * Check if transition to phase is allowed from current state
     * @param {string} phase - Target phase
     * @returns {boolean}
     */
    canTransitionTo(phase) {
        const validNext = ValidTransitions[this.currentPhase];
        return validNext && validNext.includes(phase);
    }

    /**
     * Get the current phase
     * @returns {string}
     */
    getCurrentPhase() {
        return this.currentPhase;
    }
}
