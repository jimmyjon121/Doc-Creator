# CareConnect Pro - Architecture Overview
> Version: v13-beta | Last Updated: December 6, 2025

This document provides a high-level overview of the CareConnect Pro architecture for developers and reviewers.

---

## System Overview

CareConnect Pro is an **offline-first Single Page Application (SPA)** designed for clinical coaches at Family First Adolescent Services. It runs entirely in the browser with no server dependency for core functionality.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CareConnect Pro v13-beta                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  Dashboard  │  │   Clients   │  │  Programs   │  │    Admin    │   │
│  │     Tab     │  │     Tab     │  │     Tab     │  │     Tab     │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
│         │                │                │                │           │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐   │
│  │                     UI Managers & Components                    │   │
│  │  DashboardManager, ClientProfileManager, DashboardWidgets       │   │
│  └────────────────────────────────┬────────────────────────────────┘   │
│                                   │                                     │
│  ┌────────────────────────────────┴────────────────────────────────┐   │
│  │                        Business Services                         │   │
│  │  ClientManager, TaskService, HousesManager, AftercareManager     │   │
│  └────────────────────────────────┬────────────────────────────────┘   │
│                                   │                                     │
│  ┌────────────────────────────────┴────────────────────────────────┐   │
│  │                      Persistence Layer                           │   │
│  │                     IndexedDBManager                             │   │
│  └────────────────────────────────┬────────────────────────────────┘   │
│                                   │                                     │
│  ┌────────────────────────────────┴────────────────────────────────┐   │
│  │                       Browser Storage                            │   │
│  │              IndexedDB (data) + localStorage (session)           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Module Hierarchy

### Entry Point
```
CareConnect-Pro.html (SPA Shell)
├── <head>
│   ├── CSS stylesheets (theme-tokens, app-layout, etc.)
│   ├── Vendor libraries (jQuery, Leaflet, Chart.js, GSAP)
│   └── Core script loading (see Script Load Order below)
├── <body>
│   ├── Login overlay
│   ├── Main app container (tabs, navigation)
│   └── Inline scripts (initialization, UI handlers)
└── Footer scripts (auth, persistence, tour)
```

### Core Services (`@canonical`)
```
Core Services
├── indexed-db-manager.js      → window.dbManager
│   └── Central persistence layer (IndexedDB)
│
├── client-manager.js          → window.clientManager
│   └── Client CRUD operations, task state sync
│
├── configs/task-schema.js     → window.TaskSchema
│   └── Task definitions (canonical source of truth)
│
├── js/task-service.js         → window.ClientTaskService
│   └── Task state management, TaskSchema bridge
│
└── js/utils/date-helpers.js   → window.DateHelpers
    └── Date formatting and calculations
```

### House & Milestone Managers (`@canonical`)
```
Domain Managers
├── houses-manager.js          → window.housesManager
│   └── Residential house definitions (NEST, Cove, etc.)
│
├── milestones-manager.js      → window.milestonesManager
│   └── Legacy milestone format, bridges to TaskSchema
│
├── aftercare-manager.js       → window.aftercareManager
│   └── Aftercare program options (up to 7 per client)
│
└── discharge-checklist.js     → window.dischargeChecklistManager
    └── FFAS discharge checklist workflow
```

### UI Managers (`@canonical`)
```
UI Layer
├── dashboard-manager.js       → window.dashboardManager
│   └── Dashboard orchestration, data aggregation
│
├── dashboard-widgets.js       → (class exports)
│   └── Widget components (FlightPlan, JourneyRadar, etc.)
│
├── client-profile-manager.js  → window.clientProfileManager
│   └── Client profile modal ("Chart")
│
├── outcome-tracking-modal.js  → window.outcomeTrackingModal
│   └── Discharge outcome wizard
│
└── discharged-clients-view.js → window.dischargedClientsView
    └── Discharged clients archive browser
```

### Extracted Widgets (`@canonical`)
```
js/widgets/
└── compliance-widget.js       → window.ComplianceWidget
    └── House compliance dashboard widget

js/ui/
└── document-hub.js            → window.documentHub
    └── Document status tracking modal
```

### Programs System (`@canonical`)
```
js/programs/
├── program-types.js           → window.ccProgramTypes
├── program-normalizer.js      → window.ccProgramNormalizer
├── program-core.js            → window.ccPrograms
├── map-controller.js          → window.ccMapController
├── map-icons.js               → window.ccMapIcons
├── document-model.js          → window.ccDocumentModel
├── preferences.js             → window.ccPreferences
└── app-controller.js          → window.ccAppController
```

### Authentication (`@canonical`)
```
js/auth/
├── login-robust.js            → window.CareConnectAuth, window.handleLogin
│   └── PBKDF2 hashing, rate limiting, session management
│
└── first-login-flow.js        → window.FirstLoginFlow
    └── First-time user setup wizard
```

### Legacy Modules (`@legacy` / `@deprecated`)
```
Legacy (Do Not Extend)
├── tracker-engine.js          → window.trackerEngine [@deprecated]
│   └── MIGRATION: Use TaskService
│
├── cm-tracker.js              → window.initializeCMTracker [@legacy]
│   └── Clients tab grid view
│
├── tracker-bulk-update.js     → window.trackerBulkUpdate [@legacy]
│   └── Quick update modal
│
├── tracker-timeline.js        → window.trackerTimeline [@legacy]
│   └── Visual timeline
│
└── tracker-aftercare-cascade.js → window.aftercareCascade [@legacy]
    └── Aftercare workflow UI
```

---

## Script Load Order

The application loads scripts in a specific order due to dependencies. This order is critical for the static bundle to work correctly.

```
1. Vendor Libraries (head)
   ├── pdf-lib.min.js, jspdf.umd.min.js, html2canvas.min.js
   ├── jquery-3.6.0.min.js, select2.min.js
   ├── leaflet.js, chart.min.js, d3.v7.min.js
   └── gsap.min.js

2. Core Utilities
   └── js/utils/date-helpers.js

3. Programs Data
   ├── js/programs-loader.js
   └── js/programs-init.js

4. Persistence Layer
   └── indexed-db-manager.js

5. Configuration
   └── configs/task-schema.js

6. Core Managers
   ├── client-manager.js
   ├── js/task-service.js
   └── js/demo-data.js

7. Legacy Modules
   └── cm-tracker.js

8. UI Managers
   ├── client-profile-manager.js
   ├── outcome-tracking-modal.js
   └── discharged-clients-view.js

9. Extracted Widgets
   ├── js/widgets/compliance-widget.js
   └── js/ui/document-hub.js

10. Initialization (inline)
    └── Database init, ClientManager init, TaskService init

11. Onboarding & Auth (end of body)
    ├── js/onboarding/intro/intro.js
    ├── js/auth/login-robust.js
    ├── js/auth/first-login-flow.js
    └── js/data-persistence.js

12. Enhancement Scripts (inline)
    └── Global helpers, tooltips, dashboard widgets
```

---

## Data Flow

### Client Data Flow
```
User Action (UI)
     │
     ▼
ClientProfileManager / CMTracker
     │
     ▼
ClientManager.updateClient()
     │
     ├──► TaskService.syncClientMilestones()
     │         │
     │         ▼
     │    TaskSchema (definitions)
     │
     ▼
IndexedDBManager.updateRecord()
     │
     ▼
Browser IndexedDB ('clients' store)
```

### Dashboard Data Flow
```
Dashboard Tab Shown
     │
     ▼
DashboardManager.refresh()
     │
     ├──► ClientManager.getAllClients()
     │
     ├──► HousesManager.getActiveHouses()
     │
     └──► TaskService.getSchema()
     │
     ▼
DashboardManager.cache (1-min TTL)
     │
     ▼
DashboardWidgets.notifyWidgets()
     │
     ▼
Individual Widget.render()
     │
     ▼
DOM Update
```

### Authentication Flow
```
Login Form Submit
     │
     ▼
handleLogin(username, password)
     │
     ├──► getRateLimitState() - Check lockout
     │
     ├──► verifyCredentials() - PBKDF2 or legacy hash
     │         │
     │         ├──► BetaAuthConfig (hardcoded beta creds)
     │         │
     │         └──► Stored accounts (localStorage)
     │
     ├──► createSession() - Set localStorage keys
     │
     └──► enforceAuthUI() - Show/hide app
```

---

## Storage Strategy

### IndexedDB Stores
| Store | Key | Purpose |
|-------|-----|---------|
| `programs` | `id` | 140 aftercare program definitions |
| `clients` | `id` | Active client records |
| `houses` | `id` | 5 residential house definitions |
| `clientMilestones` | `clientId` | Task completion tracking |
| `clientAssessments` | `clientId` | GAD-7, PHQ-9 scores |
| `clientAftercareOptions` | `clientId` | Aftercare program options |
| `auditLog` | auto | HIPAA-compliant access log |
| `documents` | `id` | Generated document metadata |
| `archivedClients` | `id` | Discharged client archive |

### localStorage Keys
| Key | Purpose |
|-----|---------|
| `isLoggedIn` | Session active flag |
| `username` | Current user |
| `fullName` | Display name |
| `loginExpires` | Session TTL timestamp |
| `loginAttempts` | Rate limit counter |
| `loginLockUntil` | Lockout timestamp |
| `careconnect_user_accounts` | Stored user accounts |

---

## Key Design Decisions

### 1. Offline-First Architecture
- All data stored in browser IndexedDB
- No server dependency for core operations
- Static HTML bundle can be distributed on USB drives
- Meets HIPAA requirements for disconnected clinical environments

### 2. Global Namespace Pattern
- `window.*` exports enable script coordination without a build system
- See `docs/GLOBALS-REGISTRY.md` for complete catalog
- Trade-off: Namespace pollution vs. static bundle simplicity

### 3. De-identified Client Data
- Only initials + Kipu ID stored (no PHI)
- Supports HIPAA compliance
- Real identities exist only in external Kipu EMR

### 4. Legacy Module Retention
- TrackerEngine and cm-tracker kept for beta stability
- Marked with `@legacy`/`@deprecated` for clear signaling
- Migration path documented in TECH_DEBT.md

### 5. Incremental Extraction
- Inline scripts extracted to modules gradually
- Original code commented out with extraction notes
- Allows easy rollback if issues arise

---

## Security Considerations

1. **Authentication**: PBKDF2 hashing with 100k iterations
2. **Rate Limiting**: 5 attempts before 60-second lockout
3. **Session Management**: 120-minute TTL, localStorage-based
4. **Data Privacy**: No PHI stored, audit logging enabled
5. **CSP Headers**: Restrict script/style sources

See `js/auth/login-robust.js` header for detailed security notes.

---

## For Reviewers

### Quick Navigation
- **Find any global**: `docs/GLOBALS-REGISTRY.md`
- **Understand tech debt**: `TECH_DEBT.md`
- **Module status**: Look for `@status` in file headers
- **Security review**: `js/auth/login-robust.js` header
- **Privacy review**: `indexed-db-manager.js` header

### Code Quality Indicators
- `@canonical` - Modern, well-documented module
- `@legacy` - Working but frozen, do not extend
- `@deprecated` - Scheduled for removal

---

*Architecture diagram and documentation created December 6, 2025*

