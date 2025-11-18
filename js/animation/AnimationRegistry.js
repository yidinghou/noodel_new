import { WebpageStates } from '../core/WebpageStates.js';

/**
 * AnimationRegistry - Manages animation handlers for state transitions
 * 
 * Decouples animation logic from state management
 * Allows multiple animation variants for the same transition
 * Integrates with FeatureManager for conditional animations
 * 
 * ARCHITECTURE:
 * - Stores animation handlers in a registry (fromState → toState → variant)
 * - Each handler is async function that performs animations
 * - Feature flags control which animations are enabled
 * - Supports multiple variants (e.g., 'default', 'flip', 'slide')
 * 
 * USAGE:
 *   const registry = new AnimationRegistry(controllers, featureManager);
 *   
 *   // Register an animation
 *   registry.register(
 *       WebpageStates.PAGE_LOAD,
 *       WebpageStates.START_MENU,
 *       'default',
 *       {
 *           requiredFeature: 'animations.menuDrop',
 *           handler: async (controllers) => {
 *               await controllers.animator.showStartMenu();
 *           }
 *       }
 *   );
 *   
 *   // Execute animation
 *   await registry.execute(WebpageStates.PAGE_LOAD, WebpageStates.START_MENU);
 */
export class AnimationRegistry {
    constructor(controllers, featureManager) {
        this.controllers = controllers;
        this.featureManager = featureManager;
        
        // Map: "fromState→toState" → Map of variants
        this.animations = new Map();
        
        // Debug mode
        this.debugMode = false;
    }
    
    /**
     * Register an animation handler
     * @param {string} fromState - Source webpage state
     * @param {string} toState - Target webpage state
     * @param {string} variant - Animation variant name (default: 'default')
     * @param {Object} animation - Animation definition { requiredFeature, handler }
     */
    register(fromState, toState, variant, animation) {
        const key = this.getTransitionKey(fromState, toState);
        
        if (!this.animations.has(key)) {
            this.animations.set(key, new Map());
        }
        
        this.animations.get(key).set(variant, animation);
        
        if (this.debugMode) {
            console.log(`🎬 AnimationRegistry: Registered ${fromState} → ${toState} (${variant})`);
        }
    }
    
    /**
     * Register multiple animations at once
     * @param {Object} animationDefinitions - Object with animation definitions
     */
    registerAll(animationDefinitions) {
        Object.entries(animationDefinitions).forEach(([name, definition]) => {
            const { fromState, toState, variant = 'default', ...animation } = definition;
            
            if (!fromState || !toState) {
                console.error(`AnimationRegistry: Invalid definition '${name}' - missing fromState or toState`);
                return;
            }
            
            this.register(fromState, toState, variant, animation);
        });
    }
    
    /**
     * Get an animation handler
     * @param {string} fromState - Source state
     * @param {string} toState - Target state
     * @param {string} variant - Variant name
     * @returns {Object|null} Animation definition or null
     */
    get(fromState, toState, variant = 'default') {
        const key = this.getTransitionKey(fromState, toState);
        const variants = this.animations.get(key);
        
        if (!variants) return null;
        
        // Try to get requested variant, fallback to default
        return variants.get(variant) || variants.get('default') || null;
    }
    
    /**
     * Execute an animation
     * @param {string} fromState - Source state
     * @param {string} toState - Target state
     * @param {string} variant - Animation variant to use
     * @returns {Promise} Resolves when animation completes
     */
    async execute(fromState, toState, variant = 'default') {
        const animation = this.get(fromState, toState, variant);
        
        if (!animation) {
            if (this.debugMode) {
                console.warn(`🎬 AnimationRegistry: No animation found for ${fromState} → ${toState} (${variant})`);
            }
            return;
        }
        
        // Check if animation feature is enabled
        if (animation.requiredFeature && !this.featureManager.isEnabled(animation.requiredFeature, toState)) {
            if (this.debugMode) {
                console.log(`🎬 AnimationRegistry: Animation disabled by feature flag: ${animation.requiredFeature}`);
            }
            return;
        }
        
        // Execute animation handler
        try {
            if (this.debugMode) {
                console.log(`🎬 AnimationRegistry: Executing ${fromState} → ${toState} (${variant})`);
            }
            
            await animation.handler(this.controllers);
            
            if (this.debugMode) {
                console.log(`🎬 AnimationRegistry: Completed ${fromState} → ${toState}`);
            }
        } catch (error) {
            console.error(`AnimationRegistry: Error in ${fromState} → ${toState}:`, error);
            throw error;
        }
    }
    
    /**
     * Check if animation exists
     * @param {string} fromState - Source state
     * @param {string} toState - Target state
     * @param {string} variant - Variant name
     * @returns {boolean} True if animation exists
     */
    has(fromState, toState, variant = 'default') {
        return this.get(fromState, toState, variant) !== null;
    }
    
    /**
     * Get all registered variants for a transition
     * @param {string} fromState - Source state
     * @param {string} toState - Target state
     * @returns {string[]} Array of variant names
     */
    getVariants(fromState, toState) {
        const key = this.getTransitionKey(fromState, toState);
        const variants = this.animations.get(key);
        
        return variants ? Array.from(variants.keys()) : [];
    }
    
    /**
     * Get transition key for map lookup
     * @param {string} fromState - Source state
     * @param {string} toState - Target state
     * @returns {string} Map key
     */
    getTransitionKey(fromState, toState) {
        return `${fromState}→${toState}`;
    }
    
    /**
     * Enable debug mode
     */
    enableDebug() {
        this.debugMode = true;
        console.log('🎬 AnimationRegistry: Debug mode enabled');
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
        const transitions = [];
        
        this.animations.forEach((variants, key) => {
            const variantList = Array.from(variants.keys());
            transitions.push({
                transition: key,
                variants: variantList
            });
        });
        
        return {
            transitionCount: this.animations.size,
            transitions: transitions,
            totalVariants: Array.from(this.animations.values())
                .reduce((sum, variants) => sum + variants.size, 0)
        };
    }
}
