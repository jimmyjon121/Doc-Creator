# Dead Code Audit Results

**Audit Date:** December 7, 2025  
**Auditor:** AI Assistant (Staff Engineer role)  
**Scope:** `REFACTOR-EXPERIMENTAL-2025-12-05-2055/`

---

## Summary

| Category | Count |
|----------|-------|
| Phantom Dependencies (referenced but undefined) | 2 |
| Potential Dead Functions | 1 |
| Legacy Files (documented for removal) | 3 |
| False Positives (actually used) | 5+ |

---

## 🚨 Phantom Dependencies (Referenced but Never Defined)

These modules are called in code but don't exist. The app gracefully degrades.

### 1. `window.analyticsExport`

| Item | Detail |
|------|--------|
| **References** | 37 total across 4 files |
| **Key File** | `js/admin/admin-command-center.js` (26 references) |
| **Used Methods** | `generateSummary()`, `generateExport()` |
| **Impact** | Admin analytics export features don't work |
| **Graceful Degradation** | Yes - wrapped in try/catch |

```javascript
// Example: js/admin/admin-command-center.js line 158
safeCall(() => window.analyticsExport.generateSummary())
```

**Action:** Either create the `analyticsExport` module OR remove the references and UI.

### 2. `window.analyticsDB`

| Item | Detail |
|------|--------|
| **References** | 7 total across 2 files |
| **Key Files** | `js/admin/admin-command-center.js`, `js/demo-data.js` |
| **Impact** | Analytics database features unavailable |
| **Graceful Degradation** | Yes |

**Action:** Same as analyticsExport - implement or remove.

---

## ⚠️ Potential Dead Functions (Low Usage)

### `setDemoScenario()`

| Item | Detail |
|------|--------|
| **Defined In** | `js/demo-data.js` line 869 |
| **Actual Calls** | 0 (only documented in AGENT-ONBOARDING.md) |
| **Purpose** | Developer console utility |

```javascript
// js/demo-data.js
window.setDemoScenario = (key) => this.setScenario(key);
```

**Verdict:** NOT dead code - it's a console utility for developers/demos. Keep.

---

## 📁 Legacy Files (Already Documented)

These exist in `legacy/` folder and aren't loaded by main app:

| File | Size | Status |
|------|------|--------|
| `legacy/CareConnect-Clinical-Suite.html` | Large | Old version, reference only |
| `legacy/cleanup.html` | ~218 lines | Utility for data cleanup |

**Action:** Keep in `legacy/` folder for reference. Don't load.

---

## ✅ False Positives (Verified Active)

These looked potentially dead but are actually used:

| Function/Module | Verification |
|-----------------|--------------|
| `initializeEnhancedFeatures` | 4 calls in CareConnect-Pro.html |
| `OnboardingEvents` | 29 references across 9 files |
| `featureFlags` | 17 references across 4 files |
| `CMTrackerExport` | 8 references, UI buttons in HTML |
| `clearDemoData` | 5 references including actual calls |

---

## 🔍 External JS Files vs Script Loading

### Finding: Dynamic Loading Pattern

Some JS files aren't in `<script src>` tags but are loaded dynamically:

```javascript
// CareConnect-Pro.html line 728
const dashboardScripts = [
    'dashboard-manager.js',
    'dashboard-widgets.js'
];
return Promise.all(dashboardScripts.map(src => loadScript(src)));
```

**Files loaded dynamically (NOT dead):**
- `dashboard-manager.js`
- `dashboard-widgets.js`
- `houses-manager.js`
- `milestones-manager.js`
- `aftercare-manager.js`
- `document-generator.js`

**Files loaded via inline instantiation (class defined in file, loaded elsewhere):**
- `tracker-engine.js` - Class defined, instance created in inline script
- `morning-review-dashboard.js` - Similar pattern

---

## Pre-existing Issues Found

### Timing Warning (NOT a regression)

```
Event system: Some dependencies not loaded
```

**Cause:** 10-second timeout fires before dynamic scripts complete loading.  
**Impact:** None - `initialize()` is called anyway.  
**Status:** Pre-existing, cosmetic warning only.

---

## Recommendations

### Immediate (Safe)

1. **Document phantom dependencies** - Add TODO comments where `analyticsExport`/`analyticsDB` are called
2. **Keep console utilities** - `setDemoScenario`, `clearDemoData` are developer tools

### Future (Requires More Work)

1. **Create `js/analytics/` module** - Either implement or stub `analyticsExport`
2. **Clean up Admin Command Center** - Disable export buttons if module missing
3. **Increase dynamic load timeout** - Change 10s → 30s to eliminate false warning

---

## Audit Methodology

1. **grep for window.* assignments** - Find all definitions
2. **grep for function calls** - Find all usages
3. **Compare counts** - Definition only = potentially dead
4. **Verify with runtime** - Load app, check console
5. **Document false positives** - Mark as verified active

---

*This audit did not find major dead code requiring immediate removal.*  
*The codebase has some phantom dependencies but handles them gracefully.*

