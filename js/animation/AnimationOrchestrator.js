import { CONFIG } from '../config.js';
import { WordItem } from '../word/WordItem.js';
import { calculateWordScore } from '../scoring/ScoringUtils.js';
import { FEATURES } from '../core/features.js';

/**
 * AnimationOrchestrator - Simplified async animation orchestration
 * Replaces AnimationSequencer with direct async/await for clarity
 * Each animation function directly calls controller methods
 */
export class AnimationOrchestrator {
    constructor(controllers) {
        this.animator = controllers.animator;
        this.letters = controllers.letters;
        this.score = controllers.score;
        this.menu = controllers.menu;
        this.grid = controllers.grid;
    }

    /**
     * INTRO animation sequence
     * Title drop + shake → NOODEL overlay → preview
     */
    async playIntro(gameContext = {}) {
        const dictionary = gameContext.dictionary;
        const game = gameContext.game;

        // Title drop
        if (FEATURES.ANIMATION_TITLE_DROP) {
            await this.animator.randomizeTitleLetterAnimations();
        }

        // Title shake
        if (FEATURES.ANIMATION_TITLE_SHAKE) {
            await this.animator.shakeAllTitleLetters();
        }

        // Create NOODEL word item
        const noodelDef = dictionary?.get('NOODEL') || CONFIG.GAME_INFO.NOODEL_DEFINITION;
        const noodelScore = calculateWordScore('NOODEL');
        const noodelItem = new WordItem('NOODEL', noodelDef, noodelScore);

        // Show NOODEL overlay
        this.animator.showNoodelWordOverlay(noodelItem);

        // Show preview and grid
        if (gameContext.dom?.preview) gameContext.dom.preview.classList.add('visible');
        if (gameContext.dom?.grid) gameContext.dom.grid.classList.add('visible');

        // Display preview
        await this.letters.displayPreviewStart();

        // Enable START sequence mode
        if (game) {
            game.isInStartSequence = true;
        }

        return noodelItem;
    }

    /**
     * DEBUG INTRO animation sequence
     * Faster version: skip title drop, show NOODEL directly, show stats
     */
    async playDebugIntro(gameContext = {}) {
        const dictionary = gameContext.dictionary;

        // Title shake only
        if (FEATURES.ANIMATION_TITLE_SHAKE) {
            await this.animator.shakeAllTitleLetters();
        }

        // Create and add NOODEL word directly (no overlay animation)
        const noodelDef = dictionary?.get('NOODEL') || CONFIG.GAME_INFO.NOODEL_DEFINITION;
        const noodelScore = calculateWordScore('NOODEL');
        const noodelItem = new WordItem('NOODEL', noodelDef, noodelScore);

        this.score.addWord(noodelItem);

        // Show stats
        this.animator.showStats();

        return noodelItem;
    }

    /**
     * GAME START animation sequence
     * Drop NOODEL word → show stats → initialize letters
     */
    async playGameStart(gameContext = {}) {
        let noodelItem = gameContext.noodelItem;
        const state = gameContext.state;
        const dictionary = gameContext.dictionary || gameContext.game?.wordResolver?.dictionary;
        const isFirstLoad = gameContext.isFirstLoad ?? true;

        // Recreate NOODEL item if missing (ensure it's always available for initial drop or reset)
        if (!noodelItem) {
            const noodelDef = dictionary?.get('NOODEL') || CONFIG.GAME_INFO?.NOODEL_DEFINITION;
            const noodelScore = calculateWordScore('NOODEL');
            noodelItem = new WordItem('NOODEL', noodelDef, noodelScore);
        }

        // Drop NOODEL word overlay (only on first load)
        if (isFirstLoad && document.getElementById('noodel-word-overlay')) {
            await this.animator.dropNoodelWordOverlay(() => {
                this.score.addWord(noodelItem, false);
            });
        } else if (!isFirstLoad) {
            // Add NOODEL directly on reset (when word list was cleared)
            this.score.addWord(noodelItem, false);
        }

        // Initialize progress bar
        const lettersRemaining = state?.lettersRemaining || CONFIG.GAME.INITIAL_LETTERS;
        this.animator.updateLetterProgress(lettersRemaining, CONFIG.GAME.INITIAL_LETTERS);

        // Initialize letters
        await this.letters.initialize();

        // Show preview
        const preview = document.querySelector('.preview');
        if (preview) preview.classList.add('visible');
        this.letters.display();
    }

    /**
     * RESET animation sequence
     * Menu flip + title shake (parallel)
     */
    async playReset(gameContext = {}) {
        const game = gameContext.game;

        // Run menu flip and title shake in parallel
        await Promise.all([
            (async () => {
                if (this.menu && typeof this.menu.show === 'function') {
                    await this.menu.show(true, game); // true = flip animation
                }
            })(),
            (async () => {
                if (FEATURES.ANIMATION_TITLE_SHAKE) {
                    await this.animator.shakeAllTitleLetters();
                }
            })()
        ]);

        // Start timer that will pulsate grid if user doesn't interact
        if (game && !game.hasClickedGrid) {
            setTimeout(() => {
                if (!game.hasClickedGrid) {
                    this.animator.pulsateGrid().catch(err => {
                        console.warn('Grid pulsate animation error:', err);
                    });
                }
            }, 5000);
        }
    }

    /**
     * LETTER DROP animation sequence
     * Drop letter to column → update progress bar
     */
    async dropLetter(column, letter, targetRow, onComplete, gameContext = {}) {
        // Drop animation with callback
        await new Promise((resolve) => {
            const wrappedCallback = () => {
                onComplete?.();
                resolve();
            };
            this.animator.dropLetterInColumn(column, letter, targetRow, wrappedCallback);
        });

        // Update progress bar
        const state = gameContext.state;
        if (state) {
            const lettersRemaining = state.lettersRemaining;
            this.animator.updateLetterProgress(lettersRemaining, CONFIG.GAME.INITIAL_LETTERS);
        }
    }
}
