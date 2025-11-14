# 🎯 NOODEL Game Refactoring Plan

**Date:** November 14, 2025  
**Focus Areas:** Feature Flag System & Animation Orchestration

---

## **Executive Summary**

This refactoring plan addresses two major architectural improvements:
1. **Feature Flag System**: Centralized control for enabling/disabling game features
2. **Animation Orchestration**: Declarative animation sequences replacing scattered timing logic

---

## **1. Feature Flag System** 🚩

### **Current State**
- Feature flags scattered in `config.js` (e.g., `FEATURES.TITLE_PROGRESS_BAR`)
- Debug flags mixed with game config (`DEBUG`, `DEBUG_GRID_ENABLED`)
- No centralized control or runtime toggling
- Hard to test individual features in isolation

### **Proposed Solution: Create `FeatureFlags.js`**

#### **Features to Control:**
```javascript
// Visual Features
- titleProgressBar: Show progress bar in NOODEL title
- wordDetection: Automatic word detection and scoring
- gravityPhysics: Letters fall after word removal
- letterPreview: Show next 4 letters
- scoreTracking: Track and display score

// UI Features
- menuSystem: Use menu vs simple START button

// Animations
- animations.titleDrop: NOODEL letters drop animation
- animations.titleShake: NOODEL shake effect
- animations.wordHighlight: Word found animation
- animations.letterDrop: Letter placement animation
- animations.menuFlip: Menu flip animation on reset

// Debug
- debug.enabled: Enable debug mode
- debug.skipAnimations: Skip all animations for testing
- debug.gridPattern: Load test grid pattern
- debug.logTiming: Log animation timing info
```

#### **Implementation Example:**
```javascript
export class FeatureFlags {
  static flags = {
    // Visual Features
    titleProgressBar: true,
    wordDetection: true,
    gravityPhysics: true,
    letterPreview: true,
    scoreTracking: true,
    
    // UI Features
    menuSystem: true,
    
    // Animations
    animations: {
      titleDrop: true,
      titleShake: true,
      wordHighlight: true,
      letterDrop: true,
      menuFlip: true
    },
    
    // Debug
    debug: {
      enabled: false,
      skipAnimations: false,
      gridPattern: false,
      logTiming: false
    }
  };
  
  static isEnabled(feature) {
    // Navigate nested object path (e.g., 'animations.titleDrop')
    const parts = feature.split('.');
    let current = this.flags;
    for (const part of parts) {
      if (current[part] === undefined) return false;
      current = current[part];
    }
    return !!current;
  }
  
  static enable(feature) { /* ... */ }
  static disable(feature) { /* ... */ }
  static toggle(feature) { /* ... */ }
  static set(feature, value) { /* ... */ }
}
```

#### **Usage Examples:**
```javascript
// In code
if (FeatureFlags.isEnabled('titleProgressBar')) {
  this.animator.updateLetterProgress(remaining, total);
}

// Console commands
FeatureFlags.disable('animations.titleDrop');
FeatureFlags.enable('debug.skipAnimations');

// URL parameters
// ?debug=true&noAnimations=true
```

### **Benefits:**
- ✅ Enable/disable features for testing
- ✅ A/B testing capabilities
- ✅ Easier debugging (disable all animations)
- ✅ Performance optimization (skip expensive features)
- ✅ Feature rollout control
- ✅ Runtime toggling without code changes

---

## **2. Animation Orchestration** 🎬

### **Current Issues**
- Animation sequences hard-coded across multiple files
- Timing dependencies scattered throughout code:
  - `setTimeout(() => this.menu.show(), 400)` in Game.js
  - `setTimeout(resolve, CONFIG.ANIMATION.TITLE_SHAKE_DURATION)` in AnimationController
- No central timeline or coordination
- Difficult to modify animation order
- Promise chains and nested callbacks make code hard to follow
- Can't easily skip or debug animations

### **Proposed Solution: Create `AnimationSequencer.js`**

#### **Core Concepts:**

**Declarative Animation Sequences:**
```javascript
const INTRO_SEQUENCE = [
  { 
    name: 'titleDrop',
    method: 'randomizeTitleLetterAnimations',
    duration: 'auto',
    parallel: false,
    feature: 'animations.titleDrop'
  },
  { 
    name: 'titleShake',
    method: 'shakeAllTitleLetters',
    duration: 400,
    parallel: false,
    feature: 'animations.titleShake'
  },
  { 
    name: 'showNoodelWord',
    method: 'showNoodelWordOverlay',
    duration: 300,
    parallel: false,
    onBefore: (ctx) => {
      // Create NOODEL word item
      ctx.noodelItem = new WordItem('NOODEL', definition, score);
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

const GAME_START_SEQUENCE = [
  { name: 'hideMenu', method: 'hide', target: 'menu', duration: 200 },
  { name: 'dropNoodelWord', method: 'dropNoodelWordOverlay', duration: 800 },
  { name: 'showStats', method: 'showStats', duration: 300, parallel: true },
  { name: 'showPreview', method: 'showPreview', duration: 0, parallel: true }
];

const RESET_SEQUENCE = [
  { name: 'clearGrid', method: 'clearGrid', duration: 0 },
  { name: 'showMenu', method: 'show', target: 'menu', duration: 400, parallel: true },
  { name: 'titleShake', method: 'shakeAllTitleLetters', duration: 400, parallel: true }
];
```

#### **Key Features:**
- **Parallel vs Sequential**: Run animations simultaneously or in order
- **Auto Duration**: Calculate from CSS or config automatically
- **Pause/Resume**: Debug animations step-by-step
- **Speed Control**: Global speed multiplier for testing (0.5x, 2x, etc.)
- **Event Hooks**: `onBefore`, `onAfter`, `onComplete` callbacks
- **Feature Integration**: Skip animations if feature flag is disabled
- **Multiple Targets**: Call methods on different controllers (animator, menu, grid)

#### **Implementation:**
```javascript
export class AnimationSequencer {
  constructor(controllers, featureFlags) {
    this.controllers = controllers; // { animator, menu, grid, etc. }
    this.flags = featureFlags;
    this.sequences = new Map();
    this.running = false;
    this.paused = false;
    this.speedMultiplier = 1.0;
  }
  
  defineSequence(name, steps) {
    this.sequences.set(name, steps);
  }
  
  async play(sequenceName, context = {}) {
    const steps = this.sequences.get(sequenceName);
    if (!steps) throw new Error(`Unknown sequence: ${sequenceName}`);
    
    this.running = true;
    
    for (const step of steps) {
      // Check if feature is enabled
      if (step.feature && !this.flags.isEnabled(step.feature)) {
        if (this.flags.isEnabled('debug.logTiming')) {
          console.log(`⏭️ Skipped: ${step.name} (feature disabled)`);
        }
        continue;
      }
      
      if (step.parallel) {
        // Don't wait for completion (fire and forget)
        this.executeStep(step, context);
      } else {
        // Wait for completion before continuing
        await this.executeStep(step, context);
      }
      
      // Check for pause
      while (this.paused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    this.running = false;
  }
  
  async executeStep(step, context) {
    // Get the controller (default to animator)
    const controller = step.target 
      ? this.controllers[step.target]
      : this.controllers.animator;
      
    const method = controller[step.method];
    if (!method) {
      throw new Error(`Unknown method: ${step.method} on ${step.target || 'animator'}`);
    }
    
    // Calculate adjusted duration
    const baseDuration = step.duration === 'auto' 
      ? this.calculateDuration(step.method)
      : step.duration;
    const adjustedDuration = baseDuration * this.speedMultiplier;
    
    if (this.flags.isEnabled('debug.logTiming')) {
      console.log(`▶️ ${step.name}: ${adjustedDuration}ms`);
    }
    
    // Execute hooks and method
    if (step.onBefore) await step.onBefore(context);
    
    const startTime = performance.now();
    const result = await method.call(controller, ...(step.args || []));
    const elapsed = performance.now() - startTime;
    
    if (step.onAfter) await step.onAfter(context, result);
    
    if (this.flags.isEnabled('debug.logTiming')) {
      console.log(`✅ ${step.name}: completed in ${elapsed.toFixed(2)}ms`);
    }
    
    return result;
  }
  
  calculateDuration(methodName) {
    // Look up duration from CONFIG or calculate from CSS
    // Implementation depends on specific animation
    return 400; // fallback
  }
  
  pause() { this.paused = true; }
  resume() { this.paused = false; }
  setSpeed(multiplier) { this.speedMultiplier = multiplier; }
}
```

---

## **3. Detailed Implementation Plan**

### **Phase 1: Feature Flag System** ⏱️ 1-2 hours

#### **Tasks:**
1. ✅ Create `js/FeatureFlags.js`
   - Implement core flag management
   - Add nested path navigation
   - Add enable/disable/toggle methods

2. ✅ Migrate existing flags from `config.js`
   - Move `FEATURES.TITLE_PROGRESS_BAR` → `FeatureFlags`
   - Move `DEBUG`, `DEBUG_GRID_ENABLED` → `FeatureFlags.debug`

3. ✅ Refactor code to use FeatureFlags
   - **AnimationController.js**: Wrap `updateLetterProgress()` in flag check
   - **Game.js**: Wrap word detection, menu system in flag checks
   - **GridController.js**: Wrap debug grid loading in flag check
   - **WordResolver.js**: Wrap word detection in flag check

4. ✅ Add runtime controls
   - Console API: `window.FeatureFlags.disable('animations.titleDrop')`
   - URL parameter parsing: `?debug=true&skipAnimations=true`
   - Expose on game instance: `game.features`

#### **Files to Modify:**
- `js/config.js` (remove old flags, keep constants)
- `js/AnimationController.js` (add flag checks)
- `js/Game.js` (add flag checks)
- `js/GridController.js` (add flag checks)
- `js/WordResolver.js` (add flag checks)
- `js/main.js` (parse URL params, expose FeatureFlags)

---

### **Phase 2: Animation Sequencer** ⏱️ 2-3 hours

#### **Tasks:**
1. ✅ Create `js/AnimationSequencer.js`
   - Implement sequence player
   - Support parallel/sequential execution
   - Integrate with FeatureFlags
   - Add timing/logging for debug mode

2. ✅ Create `js/AnimationSequences.js`
   - Define INTRO_SEQUENCE
   - Define GAME_START_SEQUENCE
   - Define RESET_SEQUENCE
   - Define WORD_FOUND_SEQUENCE
   - Define LETTER_DROP_SEQUENCE

3. ✅ Refactor Game.js to use sequencer
   - Replace `init()` timing logic
   - Replace `start()` timing logic
   - Replace `reset()` timing logic
   - Replace `dropLetter()` timing logic
   - Replace `checkAndProcessWords()` timing logic

4. ✅ Refactor AnimationController.js
   - Remove timing logic (move to sequences)
   - Ensure all methods return promises
   - Add cancel() methods for interruptible animations
   - Separate animation execution from coordination

#### **Files to Create:**
- `js/AnimationSequencer.js`
- `js/AnimationSequences.js`

#### **Files to Modify:**
- `js/Game.js` (major refactor - use sequencer)
- `js/AnimationController.js` (remove timing, add promises)
- `js/MenuController.js` (integrate with sequencer)

---

### **Phase 3: Code Cleanup & Testing** ⏱️ 2-3 hours

#### **Tasks:**
1. ✅ Remove deprecated code
   - Remove hard-coded setTimeout() calls
   - Remove timing constants moved to sequences
   - Clean up Promise chains

2. ✅ Add tests
   - Feature flag enable/disable tests
   - Animation sequence playback tests
   - Parallel animation tests
   - Skip animation tests (with flags disabled)

3. ✅ Documentation
   - Update README.md with new architecture
   - Add inline comments for complex sequences
   - Create usage examples

4. ✅ Performance testing
   - Test with all animations enabled
   - Test with all animations disabled
   - Measure frame rates during animations

#### **Files to Modify:**
- `js/README.md` (update architecture docs)
- Various files (cleanup and commenting)

---

## **4. File Structure After Refactoring**

```
noodel_new/
├── index.html
├── js/
│   ├── main.js                     # Entry point (modified: URL params, expose FeatureFlags)
│   ├── config.js                   # Game constants (modified: remove feature flags)
│   ├── FeatureFlags.js             # ✨ NEW: Feature flag management
│   ├── AnimationSequencer.js       # ✨ NEW: Animation orchestration
│   ├── AnimationSequences.js       # ✨ NEW: Sequence definitions
│   ├── AnimationController.js      # Refactored: Pure animation methods
│   ├── Game.js                     # Refactored: Uses sequencer
│   ├── GameState.js               # Unchanged
│   ├── DOMCache.js                # Unchanged
│   ├── GridController.js          # Refactored: Uses feature flags
│   ├── LetterController.js        # Unchanged
│   ├── ScoreController.js         # Unchanged
│   ├── WordResolver.js            # Refactored: Uses feature flags
│   ├── MenuController.js          # Refactored: Integrates with sequencer
│   ├── DictionaryManager.js       # Unchanged
│   ├── LetterGenerator.js         # Unchanged
│   ├── ScoringUtils.js            # Unchanged
│   ├── WordItem.js                # Unchanged
│   └── README.md                  # Updated with new architecture
├── styles/
│   └── [unchanged]
└── word_list/
    └── [unchanged]
```

---

## **5. Testing Strategy**

### **Feature Flag Tests**

```javascript
// Test: Disable all features
FeatureFlags.disable('titleProgressBar');
FeatureFlags.disable('wordDetection');
FeatureFlags.disable('gravityPhysics');
// Game should still load and be playable

// Test: Debug mode with no animations
FeatureFlags.enable('debug.skipAnimations');
// Should skip all animations, instant UI

// Test: Debug grid
FeatureFlags.enable('debug.gridPattern');
// Should load test pattern from config
```

### **Animation Sequencer Tests**

```javascript
// Test: Play sequence
await sequencer.play('intro');
// Verify animations play in correct order

// Test: Parallel animations
await sequencer.play('reset');
// Verify menu and title shake happen simultaneously

// Test: Cancel mid-sequence
sequencer.play('intro');
sequencer.cancel();
// Verify cleanup happens properly

// Test: Speed control
sequencer.setSpeed(2.0);
await sequencer.play('intro');
// Verify animations play at 2x speed
```

### **Integration Tests**

1. **Full game flow with all features enabled**
   - Load page → intro animation → menu → start → play → reset
   - Verify no errors in console
   - Verify animations play smoothly

2. **Debug mode (skip animations)**
   - Load with `?debug=true&skipAnimations=true`
   - Verify instant UI display
   - Verify gameplay still works

3. **Performance mode (minimal features)**
   - Disable: `animations.*`, `titleProgressBar`
   - Measure frame rate improvement
   - Verify core gameplay unaffected

---

## **6. Migration Path (No Breaking Changes)**

### **Step 1: Add FeatureFlags (Backwards Compatible)**
- Create FeatureFlags.js
- Keep existing config flags working
- Add new flag checks alongside old ones

### **Step 2: Gradually Migrate Features**
- Wrap one feature at a time
- Test each feature in isolation
- Keep old code as fallback

### **Step 3: Add AnimationSequencer**
- Create sequencer alongside existing code
- Don't remove old timing logic yet
- Test sequences in parallel

### **Step 4: Refactor One Sequence at a Time**
- Start with `intro` sequence
- Then `start` sequence
- Then `reset` sequence
- Test thoroughly after each

### **Step 5: Remove Old Code**
- Once fully migrated and tested
- Remove old setTimeout() calls
- Remove deprecated config options
- Clean up comments

---

## **7. Example: Before & After**

### **Before (Current Implementation)**

```javascript
// In Game.js init()
if (CONFIG.DEBUG) {
    await this.commonSetup();
    this.dom.stats.classList.add('visible');
    setTimeout(() => this.menu.show(), 300);
} else {
    await this.animator.randomizeTitleLetterAnimations();
    await this.animator.shakeAllTitleLetters();
    
    const noodelDef = this.wordResolver.dictionary.get('NOODEL') || CONFIG.GAME_INFO.NOODEL_DEFINITION;
    const noodelScore = calculateWordScore('NOODEL');
    this.noodelItem = new WordItem('NOODEL', noodelDef, noodelScore);
    
    this.animator.showNoodelWordOverlay(this.noodelItem);
    setTimeout(() => this.menu.show(), 400);
}
```

**Issues:**
- Hard-coded delays (300ms, 400ms)
- Logic duplicated between debug and normal mode
- Can't easily modify animation order
- Timing is scattered and fragile

---

### **After (Refactored Implementation)**

```javascript
// In Game.js init()
const context = {
    noodelDef: this.wordResolver.dictionary.get('NOODEL') || CONFIG.GAME_INFO.NOODEL_DEFINITION,
    noodelScore: calculateWordScore('NOODEL')
};

if (FeatureFlags.isEnabled('debug.skipAnimations')) {
    await this.sequencer.play('debugInit', context);
} else {
    await this.sequencer.play('intro', context);
}
```

```javascript
// In AnimationSequences.js
export const SEQUENCES = {
    intro: [
        { 
            name: 'titleDrop',
            method: 'randomizeTitleLetterAnimations',
            duration: 'auto',
            feature: 'animations.titleDrop'
        },
        { 
            name: 'titleShake',
            method: 'shakeAllTitleLetters',
            duration: 400,
            feature: 'animations.titleShake'
        },
        { 
            name: 'createNoodelWord',
            method: 'showNoodelWordOverlay',
            duration: 300,
            onBefore: (ctx) => {
                ctx.noodelItem = new WordItem('NOODEL', ctx.noodelDef, ctx.noodelScore);
            },
            args: (ctx) => [ctx.noodelItem]
        },
        { 
            name: 'showMenu',
            method: 'show',
            target: 'menu',
            duration: 400
        }
    ],
    
    debugInit: [
        { name: 'showStats', method: 'showStats', duration: 0 },
        { name: 'showMenu', method: 'show', target: 'menu', duration: 300 }
    ]
};
```

**Benefits:**
- ✅ Declarative sequence definition
- ✅ Timing centralized in one place
- ✅ Easy to modify order or add steps
- ✅ Feature flags integrated
- ✅ No code duplication
- ✅ Easy to debug and test

---

## **8. Additional Recommendations**

### **Animation Speed Control**
```javascript
// Add to FeatureFlags or as separate config
FeatureFlags.animationSpeed = 1.0; // 1.0 = normal, 0.5 = half speed, 2.0 = double

// Usage
sequencer.setSpeed(FeatureFlags.animationSpeed);

// Console commands
FeatureFlags.animationSpeed = 0.5; // Slow-mo for debugging
FeatureFlags.animationSpeed = 5.0; // Fast-forward for testing
```

### **Animation Skip Button**
```javascript
// Add keyboard shortcut
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sequencer.running) {
        sequencer.skipCurrent();
    }
});
```

### **Visual Timeline Debugger (Future)**
```javascript
// Show animation progress in dev mode
if (FeatureFlags.isEnabled('debug.showTimeline')) {
    sequencer.enableTimeline();
}

// Features:
// - Shows current step in sequence
// - Displays time remaining
// - Allows scrubbing through animations
// - Shows feature flags affecting sequence
```

### **Telemetry Hooks (Future)**
```javascript
// Track animation performance
sequencer.on('stepComplete', (step, duration) => {
    analytics.track('animation', {
        name: step.name,
        duration: duration,
        dropped_frames: /* ... */
    });
});

// Track feature usage
FeatureFlags.on('toggle', (feature, enabled) => {
    analytics.track('feature_toggle', {
        feature: feature,
        enabled: enabled
    });
});
```

---

## **9. Priority Implementation Order**

### **✅ Phase 1 - High Priority** (Must Do)
1. Create FeatureFlags.js
2. Migrate existing flags
3. Add basic flag checks to Game.js
4. Test feature enable/disable

**Time Estimate:** 1-2 hours  
**Impact:** Immediate improvement in code organization and testability

---

### **✅ Phase 2 - High Priority** (Should Do)
1. Create AnimationSequencer.js
2. Create AnimationSequences.js with basic sequences
3. Refactor Game.js init() to use sequencer
4. Test intro sequence

**Time Estimate:** 2-3 hours  
**Impact:** Major cleanup of Game.js, easier to modify animations

---

### **⚡ Phase 3 - Medium Priority** (Nice to Have)
1. Complete all sequence definitions
2. Refactor all Game.js methods to use sequencer
3. Add pause/resume/speed controls
4. Comprehensive testing

**Time Estimate:** 2-3 hours  
**Impact:** Full refactor complete, all benefits realized

---

### **🔮 Phase 4 - Low Priority** (Future Enhancements)
1. Animation skip button (ESC key)
2. Visual timeline debugger
3. Animation speed control UI
4. Telemetry and analytics
5. A/B testing framework

**Time Estimate:** 4-6 hours  
**Impact:** Advanced features for power users and developers

---

## **10. Success Metrics**

### **Code Quality**
- ❌ **Before:** 15+ setTimeout() calls scattered across 3 files
- ✅ **After:** 0 hard-coded timeouts, all timing in sequences

### **Maintainability**
- ❌ **Before:** Change animation order → edit 5 files
- ✅ **After:** Change animation order → edit 1 config

### **Testability**
- ❌ **Before:** Can't disable features, must comment out code
- ✅ **After:** `FeatureFlags.disable('feature')` in console

### **Debuggability**
- ❌ **Before:** Hard to follow animation flow through callbacks
- ✅ **After:** Read declarative sequence definition

### **Performance**
- Measure: Time to skip all animations (for repeated testing)
- Target: < 100ms with `skipAnimations` flag

---

## **11. Risk Assessment**

### **Low Risk:**
- ✅ Adding FeatureFlags alongside existing code
- ✅ Creating AnimationSequencer without removing old code
- ✅ Gradual migration one feature at a time

### **Medium Risk:**
- ⚠️ Refactoring Game.js timing logic
- ⚠️ Ensuring animations still feel smooth
- ⚠️ Maintaining backwards compatibility during migration

### **High Risk:**
- 🚨 Breaking existing animations
- 🚨 Introducing timing bugs
- 🚨 Performance regression

### **Mitigation Strategies:**
1. **Incremental changes:** One feature/sequence at a time
2. **Keep old code:** Don't delete until fully tested
3. **Extensive testing:** Test each change in browser
4. **Feature flags:** Can roll back by disabling flags
5. **Version control:** Commit after each working phase

---

## **12. Next Steps**

### **Immediate Actions:**
1. ✅ Review and approve this plan
2. ✅ Create feature branch: `feature/refactor-animations-flags`
3. ✅ Begin Phase 1: Create FeatureFlags.js
4. ✅ Test basic flag functionality

### **Week 1 Goals:**
- Complete Phase 1 (FeatureFlags)
- Complete Phase 2 (AnimationSequencer)
- Test intro sequence end-to-end

### **Week 2 Goals:**
- Complete Phase 3 (All sequences)
- Comprehensive testing
- Documentation updates

### **Future Considerations:**
- Phase 4 advanced features
- Consider extracting as reusable library
- Apply similar patterns to other game systems

---

## **Appendix: Key Code Locations**

### **Files with Hard-coded Timing:**
- `js/Game.js`: Lines with `setTimeout()`
  - Line ~80: `setTimeout(() => this.menu.show(), 400)`
  - Line ~72: `setTimeout(() => this.menu.show(), 300)`
  
- `js/AnimationController.js`: 
  - All `setTimeout(resolve, ...)` calls in animation methods
  - Lines ~40, ~60, ~130, ~180

### **Files with Feature Logic:**
- `js/config.js`: FEATURES object, DEBUG flags
- `js/Game.js`: Feature-dependent code (progress bar, word detection)
- `js/AnimationController.js`: `updateLetterProgress()` method
- `js/GridController.js`: `loadDebugGrid()` method
- `js/WordResolver.js`: `checkForWords()` method

### **Critical Animation Sequences:**
1. **Intro:** Title drop → shake → NOODEL word → menu
2. **Start:** Hide menu → drop NOODEL → show stats → show preview
3. **Reset:** Clear grid → show menu + shake title (parallel)
4. **Letter Drop:** Move to top → drop → settle → check words
5. **Word Found:** Highlight → shake → clear → gravity → recheck

---

**End of Refactoring Plan**

*Last Updated: November 14, 2025*
