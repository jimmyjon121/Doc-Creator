# Technical Debt & Legacy Components Map
> Last Updated: December 6, 2025 (v13-beta)
> Refactoring Status: **Phase 1 (Foundation) - In Progress**

This document outlines known technical debt and legacy components in the CareConnect Pro codebase. It serves as a guide for reviewers and future maintainers.

---

## ✅ Completed This Session (December 2025)

### Inline Script Extractions
| Extracted Module | Lines | New File | Status |
|------------------|-------|----------|--------|
| Admin Command Center | ~990 | `js/admin/admin-command-center.js` | ✅ Complete |
| Document Vault | ~545 | `js/ui/document-vault.js` | ✅ Complete |
| ComplianceWidget | ~315 | `js/widgets/compliance-widget.js` | ✅ Previously done |
| DocumentHub | ~490 | `js/ui/document-hub.js` | ✅ Previously done |

### JSDoc Headers Added/Enhanced
- `tracker-engine.js` - Enhanced with @fileoverview, @module, EXPORTS section
- `cm-tracker.js` - Already had comprehensive header (verified)
- `morning-review-dashboard.js` - Added @fileoverview, @module, @status

### DateHelpers Consolidation
Files updated to use `DateHelpers` with fallback:
- `js/ui/document-hub.js` - Now delegates to DateHelpers.calculateDaysInCare()
- `dashboard-manager.js` - Now delegates to DateHelpers.calculateDaysInCare()

Files already using DateHelpers:
- `tracker-engine.js` (with fallback)
- `indexed-db-manager.js` (with fallback)
- `client-profile-manager.js` (with fallback)

### Documentation Updates
- Added detailed comment block to inline bootstrap code (lines 222-737)
- Updated this TECH_DEBT.md with accurate status

### Bug Fixes
- Fixed CSS syntax error in `programs-docs-module.html` (line 19)

---

## 🚧 Legacy Modules (Maintenance Only)

### TrackerEngine (`tracker-engine.js`)
- **Status**: `@deprecated` - Scheduled for removal in v14
- **Purpose**: Legacy intelligence layer for the CM Tracker tab. Calculates scores and generates tasks based on hardcoded requirements.
- **Replacement**: Use `TaskService` (`js/task-service.js`) and `TaskSchema` (`configs/task-schema.js`) for all new development.
- **Dependencies**: Still used by:
  - `morning-review-dashboard.js`
  - `tracker-bulk-update.js`
  - `tracker-timeline.js`
  - `tracker-aftercare-cascade.js`
  - `document-generator.js`
  - `js/widgets/compliance-widget.js`

### CM Tracker (`cm-tracker.js`)
- **Status**: `@legacy` - STILL ACTIVE
- **Purpose**: Renders the "Clients" tab grid view (houses + client cards).
- **Why We Can't Remove Yet**:
  - Loaded via `<script>` in main HTML (line 168)
  - Called by `initializeCMTracker()` when Clients tab is shown
  - Demo data refresh depends on it
  - Export functionality (`cm-tracker-export.js`) builds on it
- **Replacement**: `ClientProfileManager` handles individual client modals, but there's no replacement for the grid/list view yet.
- **Plan**: Keep for beta. Target removal in v14 after building a new ClientsView component.

### Tracker Support Modules
All marked `@legacy` - depend on TrackerEngine:
- `tracker-bulk-update.js` - Quick update modal
- `tracker-timeline.js` - Visual timeline
- `tracker-aftercare-cascade.js` - Aftercare workflow

### Legacy HTML Files
- **Location**: `legacy/` directory
- **Contents**: `CareConnect-Clinical-Suite.html`, `cleanup.html`
- **Action**: Do not import or use these files. They are archives of previous iterations.

---

## ⚠️ Architectural Debt

### CareConnect-Pro.html (Monolith)
- **Current Size**: ~29,500 lines (was 30,487 before this session)
- **Risk**: Hard to maintain, prone to merge conflicts, difficult to test.
- **Progress**: 
  - ✅ Extracted ComplianceWidget (~315 lines)
  - ✅ Extracted DocumentHub (~490 lines)
  - ✅ Extracted Admin Command Center (~990 lines)
  - 📝 Documented Bootstrap Block (~515 lines) - Too critical to extract safely
  - ⏸️ CM Tracker inline (~3,950 lines) - Too coupled, defer to v14
- **Remaining Inline**: ~24,000 lines (navigation, initialization, UI handlers, CM Tracker)

### Bootstrap Block (Lines 222-737)
- **Status**: Documented, NOT extracted
- **Reason**: Contains security-critical code (ccAuth), script loading infrastructure, and global configuration that must run early in page lifecycle
- **Contents**: Error handler, dashboardState, ccAuth, ccConfig, metricHelp, metricTooltip, debug logging, loadScript
- **Action**: Future extraction requires careful refactoring to maintain load order

### Window Globals
- **Count**: ~95 `window.*` exports (includes new exports from extracted modules)
- **Documentation**: See `docs/GLOBALS-REGISTRY.md` for complete catalog
- **Risk**: Namespace pollution, implicit dependencies
- **Mitigation**: All globals documented with source files and purposes

### Inline `toLocaleDateString()` Usage
- **Issue**: Extensive use of inline date formatting in HTML templates (50+ instances).
- **Risk**: Inconsistent formatting, locale issues.
- **Mitigation**: New code MUST use `DateHelpers.formatDate()`. Legacy inline calls remain to avoid UI regressions in this beta.

### Hardcoded Credentials (Beta Only)
- **Issue**: `js/auth/login-robust.js` contains plaintext credentials for the offline beta.
- **Risk**: Security vulnerability if deployed to production.
- **Mitigation**: 
  - Wrapped in `BetaAuthConfig` with explicit warnings
  - Security review notes added for auditors
  - **MUST be externalized** before production release

---

## 🔄 Migration Paths

| Legacy Concept | Modern Replacement | Status |
|----------------|--------------------|--------|
| `TrackerEngine` | `TaskService` | In Progress - 6 dependents remaining |
| Inline Date Math | `DateHelpers` | ✅ Consolidated (with fallbacks) |
| Hardcoded Auth | Environment Config | Pending (Post-Beta) |
| `cm-tracker.js` | Future `ClientsView` | Planned for v14 |
| Inline Widgets | `js/widgets/*`, `js/ui/*` | 3 of 5 extracted |

---

## 📊 Metrics

| Metric | Before Session | After Session | Target |
|--------|----------------|---------------|--------|
| Main HTML file | 30,487 lines | ~28,950 lines | <300 lines |
| Extracted inline scripts | 2 | 4 | 5+ |
| Files with JSDoc headers | ~80% | ~85% | 100% |
| DateHelpers adoption | Partial | Consistent | Complete |
| Documented globals | 94 | 112 | All |

---

## 📝 Notes for Reviewers

### Security Review
- See security notes in `js/auth/login-robust.js` header
- Beta credentials clearly labeled with production checklist
- Rate limiting and PBKDF2 hashing documented
- `ccAuth` system in bootstrap block manages session enforcement

### Privacy/HIPAA Review
- See privacy notes in `indexed-db-manager.js` header
- No PHI stored - only de-identified client records
- Audit logging supports accountability requirements

### Code Navigation
- Use `docs/GLOBALS-REGISTRY.md` to find any global
- Use `docs/ARCHITECTURE.md` for module hierarchy
- Look for `@status` tags in file headers: `@canonical`, `@legacy`, `@deprecated`

### Date Logic
- We rely on `Math.ceil` for "days in care" (partial days count as full)
- `DateHelpers` enforces this convention
- See `js/utils/date-helpers.js`
- Note: `client-manager.js` uses `Math.floor + 1` for backward compatibility

### Session Storage
- LocalStorage is used for session persistence to support offline-first usage
- sessionStorage used for ccSessionToken (page-level)
- This is a known tradeoff for the beta
- Production should use proper session tokens

---

## 🔮 Future Work (Post-Beta)

1. **Phase 2**: Extract services (ClientService, DashboardService from managers)
2. **Phase 3**: Extract UI components (Modal, Card, DataTable base classes)
3. **Phase 4**: Set up Vite build system
4. **Phase 5**: Remove TrackerEngine and dependent legacy modules
5. **Phase 6**: Full test coverage and ESLint integration
6. **v14**: New ClientsView component to replace cm-tracker.js

---

## 📋 This Session Summary

**What Was Done:**
1. Fixed CSS syntax error in programs-docs-module.html
2. Extracted Admin Command Center (~990 lines) to `js/admin/admin-command-center.js`
3. Added documentation markers to bootstrap block (too critical to extract)
4. Enhanced JSDoc headers on tracker-engine.js, morning-review-dashboard.js
5. Consolidated date calculation logic to use DateHelpers with fallbacks
6. Updated this TECH_DEBT.md with accurate status

**What Was NOT Done (Deferred):**
- Bootstrap block extraction (security-critical, must run early)
- CM Tracker inline extraction (too tightly coupled)
- Build system setup (out of scope for this phase)
- TrackerEngine removal (too many dependents)

---

*Last reviewed: December 6, 2025*
*Session: Beta Refactoring Pass #1*
