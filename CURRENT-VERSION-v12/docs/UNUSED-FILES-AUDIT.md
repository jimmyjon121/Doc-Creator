# Unused Files Audit
## Date: November 20, 2025

## Files That Load But Are Never Used

### 1. feature-flags.js
**Status:** UNUSED
**Evidence:**
- Defines `FeatureFlagManager` class
- Never instantiated (`new FeatureFlagManager()` not found)
- No references to `window.featureFlags` anywhere
- All feature flags set to `enabled: false`
- No code checks these flags

**Safe to remove:** YES
**Risk:** Low - it's loaded but never used

### 2. intelligent-matching.js
**Status:** UNUSED
**Evidence:**
- Defines `IntelligentMatchingSystem` class
- Never instantiated
- No references found
**Safe to remove:** YES

### 3. advanced-filters.js  
**Status:** UNUSED
**Evidence:**
- No references to `AdvancedFilters` found
**Safe to remove:** YES

### 4. multi-client-workflow.js
**Status:** UNUSED
**Evidence:**
- No references to `MultiClientWorkflow` found
**Safe to remove:** YES

### 5. performance-monitor.js
**Status:** UNUSED
**Evidence:**
- No references to `PerformanceMonitor` found
**Safe to remove:** YES

### 6. morning-review-dashboard.js
**Status:** UNUSED
**Evidence:**
- No references to `MorningReviewDashboard` found
**Safe to remove:** YES

### 7. session-fix.js
**Status:** LIKELY UNUSED (one-time fix script)
**Safe to remove:** Probably YES

### 8. parse-programs.js
**Status:** BUILD SCRIPT (shouldn't be in runtime)
**Safe to remove:** YES

### 9. enhancements/onboarding-integration.js
**Status:** UNUSED
**Evidence:**
- Loads but onboardingManager never called
- No references to onboarding functions
**Safe to remove:** YES

### 10. /onboarding folder (entire system)
**Status:** UNUSED
**Evidence:**
- Integration file loads it but nothing uses it
- No calls to onboarding functions
**Safe to remove:** YES

### 11. onboarding-styles.css (root duplicate)
**Status:** DUPLICATE/UNUSED
**Safe to remove:** YES

## Summary
**Total Unused Files Found:** 11+
**Total Lines of Dead Code:** Thousands
**Safe to Remove:** Most of them

## Investigation Method
For each file:
1. Check if it exports/creates global variables
2. Search for references to those variables
3. Check if functions are called
4. Determine if removing breaks anything
