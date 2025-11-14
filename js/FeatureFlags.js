/**
 * FeatureFlags class - Centralized feature flag management
 * Controls which features are enabled/disabled in the game
 * Supports nested paths (e.g., 'animations.titleDrop')
 */
export class FeatureFlags {
    static flags = {
        // Visual Features
        titleProgressBar: true,      // Show progress bar in NOODEL title (green to gray)
        wordDetection: true,          // Automatic word detection and scoring
        gravityPhysics: true,         // Letters fall after word removal
        letterPreview: true,          // Show next 4 letters
        scoreTracking: true,          // Track and display score
        
        // UI Features
        menuSystem: true,             // Use menu vs simple START button
        
        // Animations
        animations: {
            titleDrop: true,          // NOODEL letters drop animation on load
            titleShake: true,         // NOODEL shake effect
            wordHighlight: true,      // Word found animation (green + shake)
            letterDrop: true,         // Letter placement animation
            menuFlip: true            // Menu flip animation on reset
        },
        
        // Debug Features
        debug: {
            enabled: false,           // Enable debug mode
            skipAnimations: false,    // Skip all animations for faster testing
            gridPattern: false,       // Load test grid pattern
            logTiming: false          // Log animation timing info
        }
    };
    
    /**
     * Check if a feature is enabled
     * @param {string} feature - Feature path (e.g., 'animations.titleDrop')
     * @returns {boolean} True if enabled, false otherwise
     */
    static isEnabled(feature) {
        const parts = feature.split('.');
        let current = this.flags;
        
        for (const part of parts) {
            if (current[part] === undefined) {
                console.warn(`FeatureFlags: Unknown feature '${feature}'`);
                return false;
            }
            current = current[part];
        }
        
        return !!current;
    }
    
    /**
     * Enable a feature
     * @param {string} feature - Feature path to enable
     */
    static enable(feature) {
        this.set(feature, true);
        console.log(`✅ FeatureFlags: Enabled '${feature}'`);
    }
    
    /**
     * Disable a feature
     * @param {string} feature - Feature path to disable
     */
    static disable(feature) {
        this.set(feature, false);
        console.log(`❌ FeatureFlags: Disabled '${feature}'`);
    }
    
    /**
     * Toggle a feature
     * @param {string} feature - Feature path to toggle
     */
    static toggle(feature) {
        const currentValue = this.isEnabled(feature);
        this.set(feature, !currentValue);
        console.log(`🔄 FeatureFlags: Toggled '${feature}' to ${!currentValue}`);
    }
    
    /**
     * Set a feature to a specific value
     * @param {string} feature - Feature path to set
     * @param {boolean} value - Value to set
     */
    static set(feature, value) {
        const parts = feature.split('.');
        let current = this.flags;
        
        // Navigate to parent object
        for (let i = 0; i < parts.length - 1; i++) {
            if (current[parts[i]] === undefined) {
                console.error(`FeatureFlags: Cannot set '${feature}' - path not found`);
                return;
            }
            current = current[parts[i]];
        }
        
        // Set the final property
        const lastPart = parts[parts.length - 1];
        if (current[lastPart] === undefined) {
            console.error(`FeatureFlags: Cannot set '${feature}' - property not found`);
            return;
        }
        
        current[lastPart] = value;
    }
    
    /**
     * Get all flags (for debugging)
     * @returns {object} Copy of all flags
     */
    static getAll() {
        return JSON.parse(JSON.stringify(this.flags));
    }
    
    /**
     * Reset all flags to default values
     */
    static reset() {
        this.flags = {
            titleProgressBar: true,
            wordDetection: true,
            gravityPhysics: true,
            letterPreview: true,
            scoreTracking: true,
            menuSystem: true,
            animations: {
                titleDrop: true,
                titleShake: true,
                wordHighlight: true,
                letterDrop: true,
                menuFlip: true
            },
            debug: {
                enabled: false,
                skipAnimations: false,
                gridPattern: false,
                logTiming: false
            }
        };
        console.log('🔄 FeatureFlags: Reset to defaults');
    }
    
    /**
     * Load flags from URL parameters
     * Supports: ?debug=true&skipAnimations=true&noAnimations=true
     */
    static loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        
        // Debug mode
        if (params.get('debug') === 'true') {
            this.enable('debug.enabled');
        }
        
        // Skip all animations
        if (params.get('skipAnimations') === 'true' || params.get('noAnimations') === 'true') {
            this.enable('debug.skipAnimations');
            this.disable('animations.titleDrop');
            this.disable('animations.titleShake');
            this.disable('animations.wordHighlight');
            this.disable('animations.letterDrop');
            this.disable('animations.menuFlip');
        }
        
        // Debug grid pattern
        if (params.get('debugGrid') === 'true') {
            this.enable('debug.gridPattern');
        }
        
        // Log timing
        if (params.get('logTiming') === 'true') {
            this.enable('debug.logTiming');
        }
        
        // Individual animation controls
        if (params.get('noTitleDrop') === 'true') {
            this.disable('animations.titleDrop');
        }
        if (params.get('noTitleShake') === 'true') {
            this.disable('animations.titleShake');
        }
        
        // Feature controls
        if (params.get('noProgressBar') === 'true') {
            this.disable('titleProgressBar');
        }
        if (params.get('noWordDetection') === 'true') {
            this.disable('wordDetection');
        }
        if (params.get('noGravity') === 'true') {
            this.disable('gravityPhysics');
        }
    }
}

// Expose globally for console access
if (typeof window !== 'undefined') {
    window.FeatureFlags = FeatureFlags;
}
