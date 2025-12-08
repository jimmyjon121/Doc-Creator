# CareConnect Pro - Global Variables Registry
> Last Updated: December 2025 | v13-beta
> 
> This document catalogs all `window.*` exports for the static bundle.
> The offline-first architecture requires globals for script coordination.

---

## Why Globals?

CareConnect Pro is designed to run as a **static HTML bundle** without a build system. This enables:
- **Offline-first operation** (HIPAA requirement for clinical environments)
- **Single-file distribution** to clinicians
- **No server dependency** for core functionality

Globals are the coordination mechanism between scripts loaded via `<script>` tags. This registry documents them for maintainability and reviewer clarity.

---

## Core Services (Required for App Function)

| Global | Source File | Type | Purpose |
|--------|-------------|------|---------|
| `window.dbManager` | `indexed-db-manager.js` | Instance | IndexedDB persistence layer |
| `window.clientManager` | `client-manager.js` | Instance | Client CRUD operations |
| `window.TaskSchema` | `configs/task-schema.js` | Object | Task definitions (canonical) |
| `window.ClientTaskService` | `js/task-service.js` | Class | Task state management |
| `window.DateHelpers` | `js/utils/date-helpers.js` | Object | Date formatting/math utilities |

---

## Manager Classes & Instances

### Client & House Management

| Global | Source File | Type | Purpose |
|--------|-------------|------|---------|
| `window.ClientManager` | `client-manager.js` | Class | Client manager class export |
| `window.clientManager` | `client-manager.js` | Instance | Singleton (created in HTML) |
| `window.HousesManager` | `houses-manager.js` | Class | House manager class export |
| `window.housesManager` | `houses-manager.js` | Instance | Singleton (created in CM Tracker init) |
| `window.MilestonesManager` | `milestones-manager.js` | Class | Milestone manager class export |
| `window.milestonesManager` | `milestones-manager.js` | Instance | Singleton |
| `window.AftercareManager` | `aftercare-manager.js` | Class | Aftercare manager class export |
| `window.aftercareManager` | `aftercare-manager.js` | Instance | Singleton |

### IndexedDB

| Global | Source File | Type | Purpose |
|--------|-------------|------|---------|
| `window.IndexedDBManager` | `indexed-db-manager.js` | Class | Database manager class |
| `window.indexedDBManager` | `indexed-db-manager.js` | Instance | Alternative reference |

---

## UI Managers & Components

### Dashboard

| Global | Source File | Type | Purpose |
|--------|-------------|------|---------|
| `window.dashboardManager` | `dashboard-manager.js` | Instance | Dashboard orchestration |
| `window.dashboardWidgets` | `dashboard-widgets.js` | Instance | Widget rendering manager |

### Client Profile

| Global | Source File | Type | Purpose |
|--------|-------------|------|---------|
| `window.clientProfileManager` | `client-profile-manager.js` | Instance | Profile modal manager |
| `window.viewClientDetails` | `client-profile-manager.js` | Function | Opens profile modal |

### Views & Modals

| Global | Source File | Type | Purpose |
|--------|-------------|------|---------|
| `window.dischargedClientsView` | `discharged-clients-view.js` | Instance | Discharged clients browser |
| `window.DischargedClientsView` | `discharged-clients-view.js` | Class | Class export |
| `window.showActiveClientsView` | `discharged-clients-view.js` | Function | Switch to active view |
| `window.showDischargedClientsView` | `discharged-clients-view.js` | Function | Switch to discharged view |
| `window.updateClientCounts` | `discharged-clients-view.js` | Function | Refresh tab counts |
| `window.outcomeTrackingModal` | `outcome-tracking-modal.js` | Instance | Outcome tracking wizard |
| `window.OutcomeTrackingModal` | `outcome-tracking-modal.js` | Class | Class export |
| `window.dischargeChecklistManager` | `discharge-checklist.js` | Instance | Discharge checklist |
| `window.documentGenerator` | `document-generator.js` | Instance | PDF generation |
| `window.generateDocument` | `document-generator.js` | Function | Generate document |

---

## Programs System

| Global | Source File | Type | Purpose |
|--------|-------------|------|---------|
| `window.programsData` | `js/programs-loader.js` | Array | 140 program definitions |
| `window.loadProgramsData` | `js/programs-loader.js` | Function | Load programs JSON |
| `window.ccAppController` | `js/programs/app-controller.js` | Object | Programs UI controller |
| `window.ccMapController` | `js/programs/map-controller.js` | Object | Leaflet map controller |
| `window.ccMapIcons` | `js/programs/map-icons.js` | Object | Map icon helpers |
| `window.ccPrograms` | `js/programs/program-core.js` | Object | Program query functions |
| `window.ccProgramTypes` | `js/programs/program-types.js` | Object | Program type definitions |
| `window.ccProgramNormalizer` | `js/programs/program-normalizer.js` | Object | Data normalization |
| `window.ccPreferences` | `js/programs/preferences.js` | Object | User preferences |
| `window.ccDocumentModel` | `js/programs/document-model.js` | Object | Document generation model |
| `window.ccFamilyAmbassadors` | `js/programs/app-controller.js` | Object | FA management |
| `window.updateCoachIntel` | `js/programs/app-controller.js` | Function | Update program intel |
| `window.logPlacement` | `js/programs/app-controller.js` | Function | Log placement |
| `window.saveFamilyAmbassador` | `js/programs/app-controller.js` | Function | Save FA data |
| `window.saveFFASStaff` | `js/programs/app-controller.js` | Function | Save staff data |
| `window.saveNotes` | `js/programs/app-controller.js` | Function | Save program notes |
| `window.showAddCustomProgram` | `js/programs/app-controller.js` | Function | Add custom program |

---

## Authentication & Session

| Global | Source File | Type | Purpose |
|--------|-------------|------|---------|
| `window.CareConnectAuth` | `js/auth/login-robust.js` | Object | Auth namespace |
| `window.handleLogin` | `js/auth/login-robust.js` | Function | Process login |
| `window.isLoggedIn` | `js/auth/login-robust.js` | Function | Check session validity |
| `window.logout` | `js/auth/login-robust.js` | Function | End session |
| `window.refreshAdminUI` | `js/auth/login-robust.js` | Function | Refresh admin interface |
| `window.FirstLoginFlow` | `js/auth/first-login-flow.js` | Object | First-time setup wizard |
| `window.DataPersistence` | `js/data-persistence.js` | Object | Data persistence namespace |

---

## Legacy Globals (Do Not Extend)

> **WARNING:** These globals support legacy code. Do not add new features to these modules.
> Migration targets are listed for future refactoring.

| Global | Source File | Migration Target | Removal Blocker |
|--------|-------------|------------------|-----------------|
| `window.trackerEngine` | `tracker-engine.js` | TaskService | 6+ dependent modules |
| `window.trackerEngineWarned` | `tracker-engine.js` | N/A | Dev warning flag |
| `window.initializeCMTracker` | `cm-tracker.js` | Future ClientsView | Clients tab rendering |
| `window.refreshClientsList` | `cm-tracker.js` | Future ClientsView | Alias |
| `window.refreshCMTracker` | `cm-tracker.js` | Future ClientsView | Alias |
| `window.trackerBulkUpdate` | `tracker-bulk-update.js` | TaskService UI | Quick update modal |
| `window.openBulkUpdate` | `tracker-bulk-update.js` | TaskService UI | Function |
| `window.trackerTimeline` | `tracker-timeline.js` | TaskService Timeline | Timeline visualization |
| `window.aftercareCascade` | `tracker-aftercare-cascade.js` | TaskService Workflow | Aftercare cascade UI |
| `window.morningReview` | `morning-review-dashboard.js` | TaskService | Morning review dashboard |
| `window.CMTrackerExport` | `cm-tracker-export.js` | N/A | Export functionality |

---

## Onboarding & Animation

| Global | Source File | Type | Purpose |
|--------|-------------|------|---------|
| `window.OnboardingIntro` | `js/onboarding/intro/intro.js` | Class | Video intro sequence |
| `window.Director` | `js/onboarding/intro/engine/Director.js` | Class | Animation director |
| `window.Scene` | `js/onboarding/intro/engine/Scene.js` | Class | Scene management |
| `window.AudioController` | `js/onboarding/intro/engine/AudioController.js` | Class | Audio playback |
| `window.AnimatedCursor` | `js/onboarding/intro/cursor.js` | Class | Animated cursor |
| `window.ParticleSystem` | `js/onboarding/intro/particles.js` | Class | Particle effects |
| `window.ConfettiSystem` | `js/onboarding/intro/particles.js` | Class | Confetti effects |
| `window.SVGDrawer` | `js/onboarding/intro/SVGDrawer.js` | Class | SVG line drawing |
| `window.SVGDraw` | `js/onboarding/intro/svg-draw.js` | Object | SVG draw utilities |
| `window.InteractiveTour` | `js/interactive-tour.js` | Object | Step-by-step tour |

---

## Admin Command Center

> Extracted from `CareConnect-Pro.html` in December 2025 refactoring.

| Global | Source File | Type | Purpose |
|--------|-------------|------|---------|
| `window.accSwitchTab` | `js/admin/admin-command-center.js` | Function | Switch between ACC tabs |
| `window.accRefreshData` | `js/admin/admin-command-center.js` | Function | Refresh all ACC data |
| `window.accDateRangeChanged` | `js/admin/admin-command-center.js` | Function | Handle date range selector |
| `window.accSelectExportType` | `js/admin/admin-command-center.js` | Function | Select export type |
| `window.accDownloadExport` | `js/admin/admin-command-center.js` | Function | Download analytics export |
| `window.accCopyToClipboard` | `js/admin/admin-command-center.js` | Function | Copy export to clipboard |
| `window.accExportData` | `js/admin/admin-command-center.js` | Function | Trigger export flow |
| `window.accShowOverdueDocuments` | `js/admin/admin-command-center.js` | Function | Navigate to overdue docs |
| `window.accShowPendingReferrals` | `js/admin/admin-command-center.js` | Function | Navigate to pending referrals |
| `window.accShowExpiringAuths` | `js/admin/admin-command-center.js` | Function | Navigate to expiring authorizations |
| `window.refreshAdminAnalytics` | `js/admin/admin-command-center.js` | Function | Alias for accRefreshData |

### Admin Data Wrappers

| Global | Source File | Type | Purpose |
|--------|-------------|------|---------|
| `window.adminImportData` | `js/admin/admin-data-wrappers.js` | Function | Admin-protected data import |
| `window.adminOpenProgramManager` | `js/admin/admin-data-wrappers.js` | Function | Admin-protected program manager |
| `window.adminClearAllPrograms` | `js/admin/admin-data-wrappers.js` | Function | Admin-protected program clear |

---

## User Menu

> Extracted from `CareConnect-Pro.html` in December 2025 refactoring.

| Global | Source File | Type | Purpose |
|--------|-------------|------|---------|
| `window.toggleUserMenu` | `js/ui/user-menu.js` | Function | Toggle user dropdown menu |
| `window.updateUserMenuInfo` | `js/ui/user-menu.js` | Function | Update user info in menu |
| `window.showCreateAccountForm` | `js/ui/user-menu.js` | Function | Show create account modal |
| `window.handleLogout` | `js/ui/user-menu.js` | Function | Secure logout |

---

## Document Vault

> Extracted from `CareConnect-Pro.html` in December 2025 refactoring.

| Global | Source File | Type | Purpose |
|--------|-------------|------|---------|
| `window.openDocumentVault` | `js/ui/document-vault.js` | Function | Open vault (password prompt if locked) |
| `window.handleVaultSearch` | `js/ui/document-vault.js` | Function | Handle search input in vault |
| `window.viewVaultDocument` | `js/ui/document-vault.js` | Function | View document in new window |
| `window.downloadVaultDocument` | `js/ui/document-vault.js` | Function | Download document as HTML |
| `window.deleteVaultDocument` | `js/ui/document-vault.js` | Function | Delete single document |
| `window.clearVault` | `js/ui/document-vault.js` | Function | Clear entire vault |
| `window.exportVault` | `js/ui/document-vault.js` | Function | Export vault as JSON backup |
| `window.lockVault` | `js/ui/document-vault.js` | Function | Lock the vault |
| `window.saveToVault` | `js/ui/document-vault.js` | Function | Save document to vault |

---

## Demo & Development

| Global | Source File | Type | Purpose |
|--------|-------------|------|---------|
| `window.demoData` | `js/demo-data.js` | Object | Demo data controller |
| `window.DemoDataGenerator` | `js/demo-data.js` | Class | Generator class |
| `window.populateDemoClients` | `js/demo-data.js` | Function | Quick populate |
| `window.clearDemoData` | `js/demo-data.js` | Function | Clear all demo data |
| `window.setDemoScenario` | `js/demo-data.js` | Function | Set demo scenario |
| `window.DemoClients` | `js/onboarding/demo-data/demo-clients.js` | Class | Demo client definitions |

---

## UI Utility Functions

These are defined inline in `CareConnect-Pro.html`:

| Global | Location | Purpose |
|--------|----------|---------|
| `window.closeModal` | HTML line ~921 | Close modal/overlay |
| `window.switchTab` | HTML inline | Tab navigation |
| `window.showDashboard` | HTML inline | Show dashboard view |
| `window.refreshDashboard` | HTML inline | Refresh dashboard |
| `window.showAddClientModal` | HTML inline | Open add client modal |
| `window.showNotification` | HTML inline | Toast notifications |
| `window.initializeEnhancedFeatures` | HTML line ~1813 | Initialize enhancements |
| `window.OnboardingEvents` | HTML inline | Onboarding event bus |
| `window.mountProgramsDocsModule` | HTML inline | Load programs module |
| `window.featureFlags` | HTML inline | Feature flag management |

> Note: `window.refreshAdminAnalytics` moved to `js/admin/admin-command-center.js`

---

## Adding New Globals

Before adding a new `window.*` export, consider:

### 1. Is it necessary?
Can this be passed as a parameter or accessed through an existing namespace?

### 2. Is it namespaced?
Prefer `window.cc[Feature]` over generic names to avoid collisions.

### 3. Is it documented?
Add to this registry with source file and purpose.

### 4. Export Pattern
Follow the standard export pattern at the end of your file:

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// WINDOW EXPORTS
// Required for static bundle compatibility. See docs/GLOBALS-REGISTRY.md
// ═══════════════════════════════════════════════════════════════════════════
window.MyNewFeature = MyNewFeature;
window.myNewFeatureInstance = new MyNewFeature();
```

---

## Total Count Summary

| Category | Count |
|----------|-------|
| Core Services | 5 |
| Manager Classes/Instances | 10 |
| UI Components | 15 |
| Programs System | 17 |
| Authentication | 7 |
| Legacy (Do Not Extend) | 11 |
| Onboarding | 10 |
| Demo/Dev | 6 |
| Admin Command Center | 11 |
| Admin Data Wrappers | 3 |
| User Menu | 4 |
| Document Vault | 9 |
| UI Utilities (inline) | 11 |
| **Total** | **~119** |

---

*This registry should be updated when globals are added or removed.*
*Last audited: December 6, 2025*
*Updated: Added Admin Command Center exports from extracted module*

