import { WebpageStates } from './WebpageStates.js';

/**
 * FeatureManager - State-aware feature flag management
 * 
 * Extends feature flag functionality to be aware of WebpageStates
 * Allows features to be enabled/disabled based on current UI state
 * 
 * BENEFITS:
 * - A/B testing different animations per state
 * - Disable expensive features on low-end devices
 * - Progressive enhancement based on UI context
 * - Feature flags tied to specific states
 * 
 * USAGE:
 *   const featureManager = new FeatureManager();
 *   
 *   // Basic check (state-agnostic)
 *   if (featureManager.isEnabled('animations.menuDrop')) { ... }
 *   
 *   // State-aware check
 *   if (featureManager.isEnabled('animations.menuDrop', WebpageStates.START_MENU)) { ... }
 */
export class FeatureManager {
    constructor() {
        // Core feature flags
        this.features = {
            // Visual Features
            titleProgressBar: true,
            wordDetection: true,
            gravityPhysics: true,
            letterPreview: true,
            scoreTracking: true,
            
            // UI Features
            menuSystem: true,
            gridStartMenu: false,
            previewStartMenu: true,
            
            // Animations
            animations: {
                titleDrop: true,
                titleShake: true,
                wordHighlight: true,
                letterDrop: true,
                menuFlip: true,
                menuDrop: false,
                wordOverlay: true
            },
            
            // Debug Features
            debug: {
                enabled: false,
                skipAnimations: false,
                gridPattern: false,
                logTiming: false
            }
        };
        
        // Map features to valid webpage states
        // If a feature has state restrictions, it's only enabled in those states
        this.stateFeatureMap = {
            [WebpageStates.PAGE_LOAD]: [
                'animations.titleDrop',
                'animations.titleShake',
                'titleProgressBar'
            ],
            [WebpageStates.START_MENU]: [
                'menuSystem',
                'gridStartMenu',
                'previewStartMenu',
                'animations.menuDrop',
                'animations.menuFlip',
                'animations.wordOverlay'
            ],
            [WebpageStates.GAME_RUNNING]: [
                'wordDetection',
                'gravityPhysics',
                'letterPreview',
                'scoreTracking',
                'animations.wordHighlight',
                'animations.letterDrop',
                'animations.wordOverlay'
            ],
            [WebpageStates.GAME_PAUSED]: [
                'scoreTracking',
                'letterPreview'
            ],
            [WebpageStates.RESET]: [
                'animations.menuFlip',
                'animations.titleShake'
            ]
        };
        
        // Features that are always enabled regardless of state
        this.globalFeatures = [
            'debug.enabled',
            'debug.skipAnimations',
            'debug.gridPattern',
            'debug.logTiming'
        ];
    }
    
    /**
     * Check if a feature is enabled
     * @param {string} feature - Feature path (e.g., 'animations.titleDrop')
     * @param {string} webpageState - Optional webpage state to check against
     * @returns {boolean} True if enabled and valid for state
     */
    isEnabled(feature, webpageState = null) {
        // Check if feature flag is enabled
        const flagEnabled = this.getFeatureValue(feature);
        if (!flagEnabled) {
            return false;
        }
        
        // If no state provided or feature is global, return flag value
        if (!webpageState || this.isGlobalFeature(feature)) {
            return true;
        }
        
        // Check if feature is valid for this state
        return this.isValidForState(feature, webpageState);
    }
    
    /**
     * Get the raw feature value from flags
     * @param {string} feature - Feature path
     * @returns {boolean} Feature flag value
     */
    getFeatureValue(feature) {
        const parts = feature.split('.');
        let current = this.features;
        
        for (const part of parts) {
            if (current[part] === undefined) {
                console.warn(`FeatureManager: Unknown feature '${feature}'`);
                return false;
            }
            current = current[part];
        }
        
        return !!current;
    }
    
    /**
     * Check if feature is valid for a specific webpage state
     * @param {string} feature - Feature path
     * @param {string} webpageState - Webpage state
     * @returns {boolean} True if valid for state
     */
    isValidForState(feature, webpageState) {
        const validFeatures = this.stateFeatureMap[webpageState];
        if (!validFeatures) {
            console.warn(`FeatureManager: Unknown webpage state '${webpageState}'`);
            return false;
        }
        
        return validFeatures.includes(feature);
    }
    
    /**
     * Check if feature is global (valid in all states)
     * @param {string} feature - Feature path
     * @returns {boolean} True if global feature
     */
    isGlobalFeature(feature) {
        return this.globalFeatures.includes(feature);
    }
    
    /**
     * Set a feature flag value
     * @param {string} feature - Feature path to set
     * @param {boolean} value - Value to set
     */
    setFeature(feature, value) {
        const parts = feature.split('.');
        let current = this.features;
        
        // Navigate to parent object
        for (let i = 0; i < parts.length - 1; i++) {
            if (current[parts[i]] === undefined) {
                console.error(`FeatureManager: Cannot set '${feature}' - path not found`);
                return;
            }
            current = current[parts[i]];
        }
        
        // Set the final property
        const lastPart = parts[parts.length - 1];
        if (current[lastPart] === undefined) {
            console.error(`FeatureManager: Cannot set '${feature}' - property not found`);
            return;
        }
        
        current[lastPart] = value;
    }
    
    /**
     * Enable a feature
     * @param {string} feature - Feature path to enable
     */
    enable(feature) {
        this.setFeature(feature, true);
        console.log(`✅ FeatureManager: Enabled '${feature}'`);
    }
    
    /**
     * Disable a feature
     * @param {string} feature - Feature path to disable
     */
    disable(feature) {
        this.setFeature(feature, false);
        console.log(`❌ FeatureManager: Disabled '${feature}'`);
    }
    
    /**
     * Toggle a feature
     * @param {string} feature - Feature path to toggle
     */
    toggle(feature) {
        const currentValue = this.getFeatureValue(feature);
        this.setFeature(feature, !currentValue);
        console.log(`🔄 FeatureManager: Toggled '${feature}' to ${!currentValue}`);
    }
    
    /**
     * Get all features valid for a webpage state
     * @param {string} webpageState - Webpage state
     * @returns {string[]} Array of valid feature paths
     */
    getFeaturesForState(webpageState) {
        return this.stateFeatureMap[webpageState] || [];
    }
    
    /**
     * Get all enabled features for a webpage state
     * @param {string} webpageState - Webpage state
     * @returns {string[]} Array of enabled feature paths
     */
    getEnabledFeaturesForState(webpageState) {
        const validFeatures = this.getFeaturesForState(webpageState);
        return validFeatures.filter(feature => this.getFeatureValue(feature));
    }
    
    /**
     * Get all flags (for debugging)
     * @returns {object} Copy of all flags
     */
    getAll() {
        return JSON.parse(JSON.stringify(this.features));
    }
    
    /**
     * Get debug information
     * @returns {object} Debug info
     */
    getDebugInfo() {
        return {
            features: this.getAll(),
            stateFeatureCount: Object.keys(this.stateFeatureMap).reduce((acc, state) => {
                acc[state] = this.stateFeatureMap[state].length;
                return acc;
            }, {}),
            globalFeatureCount: this.globalFeatures.length
        };
    }
}
