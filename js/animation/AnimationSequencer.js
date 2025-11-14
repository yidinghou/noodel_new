import { FeatureFlags } from '../core/FeatureFlags.js';
import { CONFIG } from '../config.js';

/**
 * AnimationSequencer class - Orchestrates animation sequences
 * Manages declarative animation steps with parallel/sequential execution
 * Integrates with FeatureFlags to skip disabled animations
 */
export class AnimationSequencer {
    constructor(controllers) {
        // Controllers: { animator, menu, grid, etc. }
        this.controllers = controllers;
        this.sequences = new Map();
        this.running = false;
        this.paused = false;
        this.currentSequence = null;
        this.speedMultiplier = 1.0;
    }

    /**
     * Define a named animation sequence
     * @param {string} name - Sequence name (e.g., 'intro', 'gameStart')
     * @param {Array} steps - Array of step definitions
     */
    defineSequence(name, steps) {
        this.sequences.set(name, steps);
    }

    /**
     * Load multiple sequences from a config object
     * @param {Object} sequences - Object mapping sequence names to step arrays
     */
    loadSequences(sequences) {
        Object.entries(sequences).forEach(([name, steps]) => {
            this.defineSequence(name, steps);
        });
    }

    /**
     * Play a named animation sequence
     * @param {string} sequenceName - Name of the sequence to play
     * @param {Object} context - Context object passed to all steps (mutable)
     * @returns {Promise} Resolves when sequence completes
     */
    async play(sequenceName, context = {}) {
        const steps = this.sequences.get(sequenceName);
        if (!steps) {
            throw new Error(`AnimationSequencer: Unknown sequence '${sequenceName}'`);
        }

        this.running = true;
        this.currentSequence = sequenceName;

        if (FeatureFlags.isEnabled('debug.logTiming')) {
            console.log(`🎬 Playing sequence: ${sequenceName}`);
        }

        try {
            // Track parallel animations to wait for at the end
            const parallelPromises = [];

            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];

                // Check for pause
                while (this.paused) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                // Check if feature is required and enabled
                if (step.feature && !FeatureFlags.isEnabled(step.feature)) {
                    if (FeatureFlags.isEnabled('debug.logTiming')) {
                        console.log(`⏭️ Skipped step '${step.name}': feature '${step.feature}' disabled`);
                    }
                    continue;
                }

                if (step.parallel) {
                    // Start parallel execution (don't wait)
                    const promise = this.executeStep(step, context, i);
                    parallelPromises.push(promise);
                } else {
                    // Wait for any pending parallel animations before sequential step
                    if (parallelPromises.length > 0) {
                        await Promise.all(parallelPromises);
                        parallelPromises.length = 0; // Clear array
                    }

                    // Execute sequential step (wait for completion)
                    await this.executeStep(step, context, i);
                }
            }

            // Wait for any remaining parallel animations
            if (parallelPromises.length > 0) {
                await Promise.all(parallelPromises);
            }

            if (FeatureFlags.isEnabled('debug.logTiming')) {
                console.log(`✅ Completed sequence: ${sequenceName}`);
            }
        } finally {
            this.running = false;
            this.currentSequence = null;
        }
    }

    /**
     * Execute a single animation step
     * @param {Object} step - Step definition
     * @param {Object} context - Shared context object
     * @param {number} index - Step index in sequence
     * @returns {Promise} Resolves when step completes
     */
    async executeStep(step, context, index) {
        const startTime = FeatureFlags.isEnabled('debug.logTiming') ? performance.now() : 0;

        // Get the target controller (default to animator)
        const controllerName = step.target || 'animator';
        const controller = this.controllers[controllerName];

        if (!controller) {
            console.error(`AnimationSequencer: Controller '${controllerName}' not found`);
            return;
        }

        // Get the method
        const method = controller[step.method];
        if (!method) {
            console.error(`AnimationSequencer: Method '${step.method}' not found on '${controllerName}'`);
            return;
        }

        // Execute onBefore hook
        if (step.onBefore) {
            await step.onBefore(context);
        }

        // Resolve arguments (can be function or array)
        let args = [];
        if (step.args) {
            args = typeof step.args === 'function' ? step.args(context) : step.args;
        }

        // Log step execution in debug mode
        if (FeatureFlags.isEnabled('debug.logTiming')) {
            const parallel = step.parallel ? '⚡' : '▶️';
            console.log(`${parallel} Step ${index + 1}: ${step.name}`, args.length > 0 ? args : '');
        }

        // Execute the animation method
        const result = await method.call(controller, ...args);

        // Calculate adjusted duration
        let duration = step.duration || 0;
        if (duration === 'auto') {
            // Try to get duration from CONFIG or calculate
            duration = this.calculateDuration(step);
        }
        duration = duration * this.speedMultiplier;

        // Wait for specified duration (if method doesn't handle its own timing)
        if (duration > 0 && step.waitAfter !== false) {
            await new Promise(resolve => setTimeout(resolve, duration));
        }

        // Execute onAfter hook
        if (step.onAfter) {
            await step.onAfter(context, result);
        }

        // Log completion in debug mode
        if (FeatureFlags.isEnabled('debug.logTiming')) {
            const elapsed = performance.now() - startTime;
            console.log(`  ✓ Completed '${step.name}' in ${elapsed.toFixed(2)}ms`);
        }

        return result;
    }

    /**
     * Calculate duration for a step with 'auto' duration
     * @param {Object} step - Step definition
     * @returns {number} Duration in milliseconds
     */
    calculateDuration(step) {
        // Map common animation methods to their config durations
        const durationMap = {
            'randomizeTitleLetterAnimations': () => {
                // Calculate based on letter count and timing
                const letterCount = 6; // NOODEL
                const interval = CONFIG.ANIMATION.TITLE_DROP_INTERVAL * 1000;
                const dropDuration = CONFIG.ANIMATION.TITLE_DROP_DURATION * 1000;
                return ((letterCount - 1) * interval) + dropDuration;
            },
            'shakeAllTitleLetters': () => CONFIG.ANIMATION.TITLE_SHAKE_DURATION,
            'dropLetterInColumn': () => CONFIG.ANIMATION.LETTER_STAGE_2_DELAY,
            'highlightAndShakeWord': () => CONFIG.ANIMATION.WORD_ANIMATION_DURATION,
            'showNoodelWordOverlay': () => 300,
            'dropNoodelWordOverlay': () => 800,
            'show': () => 400, // MenuController.show
            'hide': () => 200  // MenuController.hide
        };

        const calculator = durationMap[step.method];
        return calculator ? calculator() : 0;
    }

    /**
     * Pause the currently running sequence
     */
    pause() {
        this.paused = true;
        console.log('⏸️ Sequence paused');
    }

    /**
     * Resume a paused sequence
     */
    resume() {
        this.paused = false;
        console.log('▶️ Sequence resumed');
    }

    /**
     * Set animation speed multiplier
     * @param {number} multiplier - Speed multiplier (0.5 = half speed, 2.0 = double speed)
     */
    setSpeed(multiplier) {
        this.speedMultiplier = multiplier;
        console.log(`⚡ Animation speed set to ${multiplier}x`);
    }

    /**
     * Check if a sequence is currently running
     * @returns {boolean} True if running
     */
    isRunning() {
        return this.running;
    }

    /**
     * Get the name of the currently running sequence
     * @returns {string|null} Sequence name or null
     */
    getCurrentSequence() {
        return this.currentSequence;
    }

    /**
     * Get all defined sequence names
     * @returns {Array<string>} Array of sequence names
     */
    getSequenceNames() {
        return Array.from(this.sequences.keys());
    }
}
