/**
 * AnimationSequences - Declarative definitions of all game animation sequences
 * Each sequence is an array of steps with timing and dependency information
 */

import { WordItem } from '../word/WordItem.js';
import { calculateWordScore } from '../scoring/ScoringUtils.js';
import { CONFIG } from '../config.js';

/**
 * ATOMIC_ANIMATIONS - Reusable animation building blocks
 * These can be composed to create larger sequences
 * @type {Object<string, Object>}
 */
export const ATOMIC_ANIMATIONS = {
    /**
     * Drop and show NOODEL word overlay
     */
    dropNoodelWord: {
        name: 'dropNoodelWord',
        method: 'dropNoodelWordOverlay',
        target: 'animator',
        duration: 'auto',
        parallel: false,
        shouldRun: (ctx) => ctx.state.isFirstLoad && document.getElementById('noodel-word-overlay') !== null,
        onBefore: (ctx) => {
            ctx.addWordCallback = () => {
                if (ctx.noodelItem) {
                    ctx.score.addWord(ctx.noodelItem);
                }
            };
        },
        args: (ctx) => [ctx.addWordCallback]
    },
    
    /**
     * Add NOODEL word directly (no animation)
     */
    addNoodelWordDirectly: {
        name: 'addNoodelWordDirectly',
        method: 'addWord',
        target: 'score',
        duration: 0,
        parallel: false,
        shouldRun: (ctx) => !ctx.state.isFirstLoad,
        onBefore: (ctx) => {
            if (!ctx.noodelItem) {
                const noodelDef = ctx.dictionary?.get('NOODEL') || CONFIG.GAME_INFO.NOODEL_DEFINITION;
                const noodelScore = calculateWordScore('NOODEL');
                ctx.noodelItem = new WordItem('NOODEL', noodelDef, noodelScore);
            }
        },
        args: (ctx) => [ctx.noodelItem]
    },
    
    /**
     * Initialize progress bar display
     */
    initProgressBar: {
        name: 'initProgressBar',
        method: 'updateLetterProgress',
        target: 'animator',
        duration: 0,
        parallel: false,
        args: (ctx) => [ctx.state.lettersRemaining, CONFIG.GAME.INITIAL_LETTERS]
    },
    
    /**
     * Initialize and show letter preview
     */
    showPreview: {
        name: 'showPreview',
        method: 'display',
        target: 'letters',
        duration: 0,
        parallel: false,
        onBefore: (ctx) => {
            ctx.dom.preview.classList.add('visible');
        }
    },
    
    /**
     * Initialize letters (populate nextLetters array)
     */
    initLetters: {
        name: 'initLetters',
        method: 'initialize',
        target: 'letters',
        duration: 0,
        parallel: false
    }
};

/**
 * INTRO SEQUENCE
 * Plays when the game first loads (normal mode)
 * - Title letters drop and shake
 * - NOODEL word overlay appears
 * - Menu shows
 */
export const INTRO_SEQUENCE = [
    {
        name: 'titleDrop',
        method: 'randomizeTitleLetterAnimations',
        target: 'animator',
        duration: 'auto',
        parallel: false,
        feature: 'animations.titleDrop'
    },
    {
        name: 'titleShake',
        method: 'shakeAllTitleLetters',
        target: 'animator',
        duration: 'auto',
        parallel: false,
        feature: 'animations.titleShake'
    },
    {
        name: 'createNoodelWord',
        method: 'showNoodelWordOverlay',
        target: 'animator',
        duration: 300,
        parallel: false,
        onBefore: (ctx) => {
            // Create NOODEL word item for display
            const noodelDef = ctx.dictionary.get('NOODEL') || CONFIG.GAME_INFO.NOODEL_DEFINITION;
            const noodelScore = calculateWordScore('NOODEL');
            ctx.noodelItem = new WordItem('NOODEL', noodelDef, noodelScore);
        },
        args: (ctx) => [ctx.noodelItem]
    },
    {
        name: 'showPreviewStart',
        method: 'displayPreviewStart',
        target: 'letters',
        duration: 0,
        parallel: false,
        onAfter: (ctx) => {
            // Enable START sequence mode and highlight first square
            if (ctx.game) {
                ctx.game.initStartSequenceGuide();
            }
        }
    }
];

/**
 * DEBUG INTRO SEQUENCE
 * Plays when the game loads in debug mode (skips animations)
 * - Shake title
 * - Add NOODEL word immediately
 * - Show stats
 * - Show menu
 */
export const DEBUG_INTRO_SEQUENCE = [
    {
        name: 'titleShake',
        method: 'shakeAllTitleLetters',
        target: 'animator',
        duration: 'auto',
        parallel: false,
        feature: 'animations.titleShake'
    },
    {
        name: 'addNoodelWord',
        method: 'addWord',
        target: 'score',
        duration: 0,
        parallel: false,
        onBefore: (ctx) => {
            // Create NOODEL word item
            const noodelDef = ctx.dictionary.get('NOODEL') || CONFIG.GAME_INFO.NOODEL_DEFINITION;
            const noodelScore = calculateWordScore('NOODEL');
            ctx.noodelItem = new WordItem('NOODEL', noodelDef, noodelScore);
        },
        args: (ctx) => [ctx.noodelItem]
    },
    {
        name: 'showStats',
        method: 'showStats',
        target: 'animator',
        duration: 0,
        parallel: false
    }
];

/**
 * GAME START SEQUENCE
 * Plays when the START button is clicked
 * - Drop NOODEL word to made words list (only on first load)
 * - Show stats (parallel with drop)
 * - Initialize progress bar
 * - Show letter preview
 */
export const GAME_START_SEQUENCE = [
    ATOMIC_ANIMATIONS.dropNoodelWord,
    ATOMIC_ANIMATIONS.addNoodelWordDirectly,
    ATOMIC_ANIMATIONS.initProgressBar,
    ATOMIC_ANIMATIONS.initLetters,
    ATOMIC_ANIMATIONS.showPreview
];

/**
 * RESET SEQUENCE
 * Plays when the reset button is clicked
 * - Show menu (with flip animation)
 * - Shake title (parallel with menu)
 * - Show start preview menu (if enabled)
 * Note: Does NOT show NOODEL overlay (only shows on first load)
 */
export const RESET_SEQUENCE = [
    {
        name: 'showMenuFlip',
        method: 'show',
        target: 'menu',
        duration: 400,
        parallel: true,
        args: (ctx) => [true, ctx.game], // Pass true for flip animation and game instance
        feature: 'gridStartMenu',
        onAfter: (ctx) => {
            // Start timer that will pulsate grid if user doesn't click menu within 5 seconds
            if (ctx.game && !ctx.game.hasClickedGrid) {
                ctx.game.startInactivityTimer();
            }
        }
    },
    {
        name: 'titleShake',
        method: 'shakeAllTitleLetters',
        target: 'animator',
        duration: 'auto',
        parallel: true,
        feature: 'animations.titleShake'
    }
];

/**
 * LETTER DROP SEQUENCE
 * Plays when a player clicks a column to place a letter
 * - Animate letter dropping to target position
 * - Update game state (column fill, letters remaining)
 * - Update progress bar
 */
export const LETTER_DROP_SEQUENCE = [
    {
        name: 'dropAnimation',
        method: 'dropLetterInColumn',
        target: 'animator',
        duration: 'auto',
        parallel: false,
        feature: 'animations.letterDrop',
        // Args will be provided by Game.js: [column, letter, targetRow, callback]
        onAfter: (ctx) => {
            // Update game state after drop completes
            ctx.state.incrementColumnFill(ctx.column);
            ctx.letters.advance();
            ctx.score.updateLettersRemaining();
        }
    },
    {
        name: 'updateProgressBar',
        method: 'updateLetterProgress',
        target: 'animator',
        duration: 0,
        parallel: false,
        args: (ctx) => [ctx.state.lettersRemaining, CONFIG.GAME.INITIAL_LETTERS]
    }
];

/**
 * WORD FOUND SEQUENCE (Single Iteration)
 * Plays when words are detected on the grid
 * - Start resolve grace animation (1s fill animation)
 * - Add words to score
 * - Clear word cells
 * - Apply gravity
 * Note: This sequence is called repeatedly until no more words are found
 */
export const WORD_FOUND_SEQUENCE = [
    {
        name: 'startResolveGrace',
        method: 'startResolveGrace',
        target: 'animator',
        duration: 'auto',
        parallel: false,
        feature: 'animations.wordHighlight',
        onBefore: (ctx) => {
            // Start resolve controllers for all found words
            ctx.resolveControllers = ctx.foundWords.map(wordData =>
                ctx.animator.startResolveGrace(wordData.positions, 1000)
            );
        },
        onAfter: async (ctx) => {
            // Wait for all resolve controllers to complete and finalize them
            await ctx.animator.awaitAndFinalizeResolveGraces(ctx.resolveControllers);
        }
    },
    {
        name: 'addWordsToScore',
        method: 'addWords', // Custom method we'll add to ScoreController
        target: 'score',
        duration: 0,
        parallel: false,
        onBefore: (ctx) => {
            // Add all words to score
            ctx.foundWords.forEach(wordData => {
                const points = calculateWordScore(wordData.word);
                const wordItem = new WordItem(wordData.word, wordData.definition, points);
                ctx.score.addWord(wordItem);
            });
        }
    },
    {
        name: 'clearWordCells',
        method: 'clearWords', // Custom method we'll add to AnimationController
        target: 'animator',
        duration: (() => {
            const root = getComputedStyle(document.documentElement);
            return parseFloat(root.getPropertyValue('--animation-delay-word-clear').trim());
        })(),
        parallel: false,
        onBefore: (ctx) => {
            // Clear all word cells
            ctx.foundWords.forEach(wordData => {
                ctx.animator.clearWordCells(wordData.positions);
            });
        }
    },
    {
        name: 'applyGravity',
        method: 'applyGravity',
        target: 'grid',
        duration: 300, // Short delay for gravity to settle
        parallel: false,
        feature: 'gravityPhysics'
    }
];

/**
 * CLEAR MODE COMPLETE SEQUENCE
 * Plays when Clear Mode is completed (all cells cleared)
 * - Celebrate grid with cascade animation
 * - Show victory message overlay
 * - Return to menu
 */
export const CLEAR_MODE_COMPLETE_SEQUENCE = [
    {
        name: 'celebrateGridClear',
        method: 'celebrateGridClear',
        target: 'animator',
        duration: 800,
        parallel: false
    },
    {
        name: 'showVictoryMessage',
        method: 'showVictoryOverlay',
        target: 'animator',
        duration: 1000,
        args: (ctx) => [`🎉 Clear Mode Complete! 🎉\nScore: ${Math.round(ctx.finalScore)}`],
        parallel: false,
        onAfter: (ctx) => {
            // Wait for user to acknowledge or auto-dismiss after 5 seconds
            return new Promise(resolve => {
                const timeoutId = setTimeout(() => {
                    resolve();
                }, 4000); // Auto-dismiss after 4 seconds (1s margin before next sequence)
                
                // Allow click to dismiss early
                const onClick = () => {
                    clearTimeout(timeoutId);
                    document.removeEventListener('click', onClick);
                    resolve();
                };
                document.addEventListener('click', onClick);
            });
        }
    },
    {
        name: 'showMenu',
        method: 'show',
        target: 'menu',
        duration: 400,
        parallel: false
    }
];

/**
 * SequenceNames - Enum for type-safe sequence name references
 * @enum {string}
 */
export const SequenceNames = {
    INTRO: 'intro',
    DEBUG_INTRO: 'debugIntro',
    GAME_START: 'gameStart',
    RESET: 'reset',
    LETTER_DROP: 'letterDrop',
    WORD_FOUND: 'wordFound',
    CLEAR_MODE_COMPLETE: 'clearModeComplete'
};

/**
 * All sequences mapped by name
 */
export const SEQUENCES = {
    [SequenceNames.INTRO]: INTRO_SEQUENCE,
    [SequenceNames.DEBUG_INTRO]: DEBUG_INTRO_SEQUENCE,
    [SequenceNames.GAME_START]: GAME_START_SEQUENCE,
    [SequenceNames.RESET]: RESET_SEQUENCE,
    [SequenceNames.LETTER_DROP]: LETTER_DROP_SEQUENCE,
    [SequenceNames.WORD_FOUND]: WORD_FOUND_SEQUENCE,
    [SequenceNames.CLEAR_MODE_COMPLETE]: CLEAR_MODE_COMPLETE_SEQUENCE
};
