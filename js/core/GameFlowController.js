import { GamePhase } from './GameStateMachine.js';
import { GameModes } from '../config.js';

/**
 * GameFlowController - Manages game initialization, startup, and reset flows
 * 
 * Responsibilities:
 * - Game initialization (dictionary loading, grid setup, intro sequence)
 * - Game startup (mode selection, game start sequence)
 * - Game reset (returning to menu, clearing state)
 * - Event listener setup
 * 
 * This extracts game flow logic from the monolithic Game class,
 * making initialization sequences testable and reusable.
 */
export class GameFlowController {
    /**
     * Initialize GameFlowController
     * @param {Object} game - Game instance (for state/controllers access)
     * @param {GameStateMachine} stateMachine - Game phase manager
     * @param {AnimationOrchestrator} orchestrator - Animation orchestrator
     * @param {FeatureManager} features - Feature flags
     * @param {WordGracePeriodManager} gracePeriodManager - Grace period manager
     */
    constructor(game, stateMachine, orchestrator, features, gracePeriodManager) {
        this.game = game;
        this.stateMachine = stateMachine;
        this.orchestrator = orchestrator;
        this.features = features;
        this.gracePeriodManager = gracePeriodManager;
    }

    /**
     * Initialize the game: load dictionary, setup grid, play intro sequence
     * Called once on page load
     */
    async init() {
        // Load dictionary and initialize WordResolver
        console.log('Loading dictionary...');
        const wordResolver = await this.game.initializeWordResolver();
        console.log('Dictionary loaded successfully!');
        
        // Set up word grace period manager's expiration callback
        this.gracePeriodManager.setOnWordExpired(
            (wordData, wordKey, origCallback) => this.game.handleWordExpired(wordData, wordKey, origCallback)
        );
        
        // Initialize score display with config values
        this.game.score.init();
        
        // Setup grid and letters
        this.game.grid.generate();
        
        // Load debug grid if enabled (for testing word detection)
        if (this.features.isEnabled('debug.enabled') && this.features.isEnabled('debug.gridPattern')) {
            this.game.grid.loadDebugGrid();
        }
        
        // Create shared context for animation execution
        const context = {
            dictionary: wordResolver.dictionary,
            state: this.game.state,
            dom: this.game.dom,
            game: this.game
        };
        
        // Transition to intro animation phase
        this.stateMachine.transition(GamePhase.INTRO_ANIMATION);
        
        // Play appropriate intro sequence based on debug mode
        let noodelItem;
        if (this.features.isEnabled('debug.enabled')) {
            noodelItem = await this.orchestrator.playDebugIntro(context);
        } else {
            noodelItem = await this.orchestrator.playIntro(context);
        }
        
        // Store noodelItem for later use in startGame()
        this.game.noodelItem = noodelItem;
        
        // Transition to START sequence phase
        this.stateMachine.transition(GamePhase.START_SEQUENCE);
        
        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for game controls (start/reset, mute, skip tutorial)
     */
    setupEventListeners() {
        // Start/Reset button
        this.game.dom.startBtn.addEventListener('click', () => {
            if (!this.game.state.started) {
                this.game.start();
            } else {
                this.game.reset();
            }
        });
        
        // Mute button
        this.game.dom.muteBtn.addEventListener('click', () => {
            this.game.dom.muteBtn.textContent = this.game.dom.muteBtn.textContent === '🔊' ? '🔇' : '🔊';
        });
        
        // Skip Tutorial button
        if (this.game.dom.skipTutorialBtn) {
            this.game.dom.skipTutorialBtn.addEventListener('click', () => {
                this.game.skipTutorial();
            });
        }
        
        // Setup grid click handlers once during initialization
        this.game.grid.addClickHandlers((e) => this.game.handleSquareClick(e));
    }

    /**
     * Start game in specified mode (CLASSIC or CLEAR)
     * @param {string} gameMode - Game mode (from GameModes enum)
     */
    async startGame(gameMode = GameModes.CLASSIC) {
        // Set game mode
        this.game.currentGameMode = gameMode;
        this.game.state.gameMode = gameMode;
        
        this.game.state.started = true;
        this.game.dom.startBtn.textContent = '🔄';
        
        // Create context for game start sequence
        const context = {
            noodelItem: this.game.noodelItem,
            state: this.game.state,
            isFirstLoad: this.game.state.isFirstLoad,
            dom: this.game.dom
        };
        
        // Play game start sequence
        await this.orchestrator.playGameStart(context);
        
        // Clear noodelItem reference after it's been added
        this.game.noodelItem = null;
    }

    async resetGame() {
        // Show letters-remaining counter at game start/reset
        if (this.game.dom.lettersRemainingContainer) {
            this.game.dom.lettersRemainingContainer.classList.add('visible');
        }
        
        // Reset input buffer
        this.game.lastDropTime = 0;
        
        // Clear any pending words with grace period
        this.gracePeriodManager.clearAll();
        
        // Reset game state with current game mode (score, letters, grid data)
        this.game.state.reset();
        // Preserve the game mode across resets
        this.game.state.gameMode = this.game.currentGameMode;
        
        // Reset all controller displays (this updates the DOM)
        this.game.score.displayReset();
        this.game.grid.displayReset();
        
        // Update button to show reset icon
        this.game.dom.startBtn.textContent = '🔄';
        
        // Mark game as started
        this.game.state.started = true;
        
        // Create context for game start sequence
        const context = {
            noodelItem: null,
            state: this.game.state,
            isFirstLoad: false,
            dom: this.game.dom,
            game: this.game
        };
        
        // Play game start sequence (adds NOODEL word to the list)
        await this.orchestrator.playGameStart(context);
        
        // Re-add click handlers after grid regeneration
        this.game.grid.addClickHandlers((e) => this.game.handleSquareClick(e));
    }
}
