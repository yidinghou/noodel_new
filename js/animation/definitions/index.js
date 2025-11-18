/**
 * Animation Definitions Index
 * 
 * Central export point for all animation definitions
 * Import from this file to get all animations
 */

import { menuAnimations } from './menuAnimations.js';
import { gameAnimations } from './gameAnimations.js';

/**
 * All animation definitions combined
 */
export const allAnimations = {
    ...menuAnimations,
    ...gameAnimations
};

/**
 * Export individual animation sets
 */
export { menuAnimations, gameAnimations };

/**
 * Get animation by name
 * @param {string} name - Animation name
 * @returns {Object|null} Animation definition or null
 */
export function getAnimation(name) {
    return allAnimations[name] || null;
}

/**
 * Get all animation names
 * @returns {string[]} Array of all animation names
 */
export function getAllAnimationNames() {
    return Object.keys(allAnimations);
}
