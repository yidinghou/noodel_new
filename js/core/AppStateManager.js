import { WebpageStates, WebpageStateTransitions, isValidTransition } from './WebpageStates.js';
import { GameplayStates, GameplayStateTransitions } from './GameplayStates.js';
import { MenuStates, MenuStateTransitions } from '../menu/MenuStates.js';

/**
 * AppStateManager - Unified state orchestrator
 * 
 * Coordinates three state systems:
 * 1. WebpageStates - Overall UI/page flow
 * 2. GameplayStates - Board/game logic
 * 3. MenuStates - Menu visibility/type
 * 
 * RESPONSIBILITIES:
 * - Manage all three state systems in one place
 * - Validate state transitions
 * - Execute animations via AnimationRegistry
 * - Emit events for state changes
 * - Provide unified API for state queries
 * 
 * ARCHITECTURE:
 * - Each state system is independent but coordinated
 * - Webpage state transitions trigger animations
 * - Menu and gameplay states can change within webpage states
 * - Event-driven: emit events for observers
 * 
 * USAGE:
 *   const appState = new AppStateManager(featureManager, animationRegistry);
 *   
 *   // Transition with automatic animation
 *   await appState.transitionTo(WebpageStates.START_MENU);
 *   
 *   // Change gameplay state (no animation)
 *   appState.setGameplayState(GameplayStates.AWAITING_INPUT);
 *   
 *   // Listen to changes
 *   appState.on('webpageStateChanged', (data) => {
 *       console.log(`UI changed: ${data.from} → ${data.to}`);
 *   });
 */
export class AppStateManager {
    constructor(featureManager, animationRegistry) {
        this.featureManager = featureManager;
        this.animationRegistry = animationRegistry;
        
        // Current states
        this.webpageState = WebpageStates.PAGE_LOAD;
        this.gameplayState = GameplayStates.BOARD_READY;
        this.menuState = MenuStates.HIDDEN;
        
        // State history
        this.webpageHistory = [WebpageStates.PAGE_LOAD];
        this.gameplayHistory = [GameplayStates.BOARD_READY];
        this.menuHistory = [MenuStates.HIDDEN];
        
        // Event listeners
        this.listeners = new Map();
        
        // Debug mode
        this.debugMode = false;
    }
    
    /**
     * Transition to a new webpage state with animation
     * @param {string} newState - Target webpage state
     * @param {string} animationVariant - Animation variant to use (default: 'default')
     * @returns {Promise} Resolves when transition and animation complete
     */
    async transitionTo(newState, animationVariant = 'default') {
        const currentState = this.webpageState;
        
        // Validate state exists
        if (!Object.values(WebpageStates).includes(newState)) {
            console.error(`AppStateManager: Invalid webpage state: ${newState}`);
            return false;
        }
        
        // Check if already in target state
        if (currentState === newState) {
            if (this.debugMode) {
                console.log(`AppStateManager: Already in state: ${newState}`);
            }
            return true;
        }
        
        // Validate transition
        if (!isValidTransition(currentState, newState)) {
            console.error(`AppStateManager: Invalid transition: ${currentState} → ${newState}`);
            return false;
        }
        
        if (this.debugMode) {
            console.log(`🎮 AppStateManager: Transitioning ${currentState} → ${newState}`);
        }
        
        // Emit beforeTransition event
        this.emit('beforeWebpageTransition', { from: currentState, to: newState });
        
        // Execute animation (if registered)
        if (this.animationRegistry) {
            try {
                await this.animationRegistry.execute(currentState, newState, animationVariant);
            } catch (error) {
                console.error(`AppStateManager: Animation error during ${currentState} → ${newState}:`, error);
                // Continue with state change even if animation fails
            }
        }
        
        // Update state
        this.webpageState = newState;
        this.webpageHistory.push(newState);
        
        if (this.debugMode) {
            console.log(`✅ AppStateManager: Now in state: ${newState}`);
        }
        
        // Emit afterTransition event
        this.emit('webpageStateChanged', { from: currentState, to: newState });
        
        return true;
    }
    
    /**
     * Set gameplay state (no animation)
     * @param {string} newState - Target gameplay state
     * @returns {boolean} True if successful
     */
    setGameplayState(newState) {
        const currentState = this.gameplayState;
        
        // Validate state exists
        if (!Object.values(GameplayStates).includes(newState)) {
            console.error(`AppStateManager: Invalid gameplay state: ${newState}`);
            return false;
        }
        
        // Check if already in target state
        if (currentState === newState) {
            return true;
        }
        
        // Update state
        this.gameplayState = newState;
        this.gameplayHistory.push(newState);
        
        if (this.debugMode) {
            console.log(`🎮 AppStateManager: Gameplay state changed: ${currentState} → ${newState}`);
        }
        
        // Emit event
        this.emit('gameplayStateChanged', { from: currentState, to: newState });
        
        return true;
    }
    
    /**
     * Set menu state (no animation)
     * @param {string} newState - Target menu state
     * @returns {boolean} True if successful
     */
    setMenuState(newState) {
        const currentState = this.menuState;
        
        // Validate state exists
        if (!Object.values(MenuStates).includes(newState)) {
            console.error(`AppStateManager: Invalid menu state: ${newState}`);
            return false;
        }
        
        // Check if already in target state
        if (currentState === newState) {
            return true;
        }
        
        // Update state
        this.menuState = newState;
        this.menuHistory.push(newState);
        
        if (this.debugMode) {
            console.log(`🎮 AppStateManager: Menu state changed: ${currentState} → ${newState}`);
        }
        
        // Emit event
        this.emit('menuStateChanged', { from: currentState, to: newState });
        
        return true;
    }
    
    /**
     * Get current webpage state
     * @returns {string} Current webpage state
     */
    getWebpageState() {
        return this.webpageState;
    }
    
    /**
     * Get current gameplay state
     * @returns {string} Current gameplay state
     */
    getGameplayState() {
        return this.gameplayState;
    }
    
    /**
     * Get current menu state
     * @returns {string} Current menu state
     */
    getMenuState() {
        return this.menuState;
    }
    
    /**
     * Get all current states
     * @returns {Object} Object with all current states
     */
    getAllStates() {
        return {
            webpage: this.webpageState,
            gameplay: this.gameplayState,
            menu: this.menuState
        };
    }
    
    /**
     * Check if in a specific webpage state
     * @param {string} state - State to check
     * @returns {boolean} True if in that state
     */
    isInWebpageState(state) {
        return this.webpageState === state;
    }
    
    /**
     * Check if game is running
     * @returns {boolean} True if in GAME_RUNNING webpage state
     */
    isGameRunning() {
        return this.webpageState === WebpageStates.GAME_RUNNING;
    }
    
    /**
     * Check if menu is visible
     * @returns {boolean} True if menu state is not HIDDEN
     */
    isMenuVisible() {
        return this.menuState !== MenuStates.HIDDEN;
    }
    
    /**
     * Register an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    /**
     * Unregister an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback to remove
     */
    off(event, callback) {
        if (!this.listeners.has(event)) return;
        
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }
    
    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {any} data - Event data
     */
    emit(event, data) {
        if (!this.listeners.has(event)) return;
        
        const callbacks = this.listeners.get(event);
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`AppStateManager: Error in ${event} listener:`, error);
            }
        });
    }
    
    /**
     * Enable debug mode
     */
    enableDebug() {
        this.debugMode = true;
        console.log('🎮 AppStateManager: Debug mode enabled');
    }
    
    /**
     * Disable debug mode
     */
    disableDebug() {
        this.debugMode = false;
    }
    
    /**
     * Get debug information
     * @returns {Object} Debug info
     */
    getDebugInfo() {
        return {
            currentStates: this.getAllStates(),
            webpageHistory: this.webpageHistory,
            gameplayHistory: this.gameplayHistory,
            menuHistory: this.menuHistory,
            listenerCount: Array.from(this.listeners.values())
                .reduce((sum, arr) => sum + arr.length, 0),
            registeredEvents: Array.from(this.listeners.keys())
        };
    }
    
    /**
     * Reset to initial states
     */
    reset() {
        this.webpageState = WebpageStates.PAGE_LOAD;
        this.gameplayState = GameplayStates.BOARD_READY;
        this.menuState = MenuStates.HIDDEN;
        
        this.webpageHistory = [WebpageStates.PAGE_LOAD];
        this.gameplayHistory = [GameplayStates.BOARD_READY];
        this.menuHistory = [MenuStates.HIDDEN];
        
        if (this.debugMode) {
            console.log('🎮 AppStateManager: Reset to initial states');
        }
        
        this.emit('reset', this.getAllStates());
    }
}
