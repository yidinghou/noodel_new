/**
 * AnimationSequences - Declarative definitions of all game animation sequences
 * Each sequence is an array of steps with timing and dependency information
 */

import { WordItem } from '../word/WordItem.js';
import { calculateWordScore } from '../scoring/ScoringUtils.js';
import { CONFIG } from '../config.js';

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
        name: 'showMenu',
        method: 'show',
        target: 'menu',
        duration: 400,
        parallel: false,
        args: (ctx) => [false, ctx.game], // Pass useFlip=false and game instance
        onAfter: (ctx) => {
            // Start timer that will pulsate grid if user doesn't click menu within 5 seconds
            if (ctx.game && !ctx.game.hasClickedGrid) {
                ctx.game.startInactivityTimer();
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
    },
    {
        name: 'showMenu',
        method: 'show',
        target: 'menu',
        duration: 300,
        parallel: false
    }
];

/**
 * GAME START SEQUENCE
 * Plays when the START button is clicked
 * - Hide menu
 * - Drop NOODEL word to made words list
 * - Show stats (parallel with drop)
 * - Initialize progress bar
 * - Show letter preview
 */
export const GAME_START_SEQUENCE = [
    {
        name: 'hideMenu',
        method: 'hide',
        target: 'menu',
        duration: 0,
        parallel: false
    },
    {
        name: 'dropNoodelWord',
        method: 'dropNoodelWordOverlay',
        target: 'animator',
        duration: 'auto',
        parallel: false,
        onBefore: (ctx) => {
            // Set up callback to add word after drop animation
            ctx.addWordCallback = () => {
                if (ctx.noodelItem) {
                    ctx.score.addWord(ctx.noodelItem);
                }
            };
        },
        args: (ctx) => [ctx.addWordCallback]
    },
    {
        name: 'initProgressBar',
        method: 'updateLetterProgress',
        target: 'animator',
        duration: 0,
        parallel: false,
        args: (ctx) => [ctx.state.lettersRemaining, CONFIG.GAME.INITIAL_LETTERS]
    },
    {
        name: 'showPreview',
        method: 'display',
        target: 'letters',
        duration: 0,
        parallel: false,
        onBefore: (ctx) => {
            ctx.dom.preview.classList.add('visible');
        }
    }
];

/**
 * RESET SEQUENCE
 * Plays when the reset button is clicked
 * - Show menu (with flip animation)
 * - Shake title (parallel with menu)
 */
export const RESET_SEQUENCE = [
    {
        name: 'showMenuFlip',
        method: 'show',
        target: 'menu',
        duration: 400,
        parallel: true,
        args: [true], // Pass true for flip animation
        feature: 'animations.menuFlip'
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
 * - Highlight and shake all found words (parallel)
 * - Add words to score
 * - Clear word cells
 * - Apply gravity
 * Note: This sequence is called repeatedly until no more words are found
 */
export const WORD_FOUND_SEQUENCE = [
    {
        name: 'highlightWords',
        method: 'highlightWords', // Custom method we'll add to handle multiple words
        target: 'animator',
        duration: 'auto',
        parallel: false,
        feature: 'animations.wordHighlight',
        onBefore: (ctx) => {
            // Store promises for parallel word animations
            ctx.animationPromises = ctx.foundWords.map(wordData => 
                ctx.animator.highlightAndShakeWord(wordData.positions)
            );
        },
        onAfter: async (ctx) => {
            // Wait for all word animations to complete
            if (ctx.animationPromises && ctx.animationPromises.length > 0) {
                await Promise.all(ctx.animationPromises);
            }
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
 * All sequences mapped by name
 */
export const SEQUENCES = {
    intro: INTRO_SEQUENCE,
    debugIntro: DEBUG_INTRO_SEQUENCE,
    gameStart: GAME_START_SEQUENCE,
    reset: RESET_SEQUENCE,
    letterDrop: LETTER_DROP_SEQUENCE,
    wordFound: WORD_FOUND_SEQUENCE
};
