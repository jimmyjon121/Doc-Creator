# CareConnect Pro – Complete Agent Onboarding Guide

> **Last Updated**: November 27, 2025  
> **Version**: v13.0.0 (Stability Release)  
> **Purpose**: Comprehensive context for AI agents and new developers working on CareConnect Pro

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Directory Structure](#2-directory-structure)
3. [Core JavaScript Modules](#3-core-javascript-modules)
4. [IndexedDB Schema](#4-indexeddb-schema)
5. [Task Schema System](#5-task-schema-system)
6. [Houses & Capacity](#6-houses--capacity)
7. [UI Workspaces](#7-ui-workspaces)
8. [Key Global Objects](#8-key-global-objects)
9. [Metric Tooltip System](#9-metric-tooltip-system)
10. [Authentication System](#10-authentication-system)
11. [Demo Data System](#11-demo-data-system)
12. [Feature Flags](#12-feature-flags)
13. [Document Generation](#13-document-generation)
14. [Programs Module](#14-programs-module)
15. [Analytics System](#15-analytics-system)
16. [Tracker System](#16-tracker-system)
17. [Discharge Workflow](#17-discharge-workflow)
18. [Design System & Styling](#18-design-system--styling)
19. [Development Workflow](#19-development-workflow)
20. [Conventions & Standards](#20-conventions--standards)
21. [Common Tasks](#21-common-tasks)
22. [Pending Work](#22-pending-work)
23. [Troubleshooting](#23-troubleshooting)
24. [Questions to Ask](#24-questions-to-ask)

---

## 1. Project Overview

### What is CareConnect Pro?

CareConnect Pro is a **HIPAA-compliant, offline-first clinical case management application** built for **Family First Adolescent Services**. It serves clinical coaches, supervisors, and families in adolescent residential treatment settings.

### Mission Statement

> Ensure every adolescent receives timely, comprehensive aftercare planning while freeing clinical coaches to focus on direct care.

### Key Outcomes

- **Research Time**: 30–45 minute research cycles reduced to ~30 seconds
- **Data Accuracy**: 95% accuracy on 60+ extracted program fields
- **Compliance**: 95%+ milestone completion rates

### Target Users

| Persona | Primary Use |
|---------|-------------|
| Clinical Coaches | Daily task management, client tracking, document creation |
| Supervisors/Admins | Analytics, compliance monitoring, house occupancy |
| Families | Receive discharge packets with aftercare options |

### Technology Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Vanilla JavaScript (ES6+), no frameworks |
| **Storage** | IndexedDB (primary), localStorage (session/preferences) |
| **PDF Generation** | jsPDF, html2canvas, pdf-lib |
| **Maps** | Leaflet.js |
| **Charts** | Chart.js, D3.js v7 |
| **UI Components** | jQuery 3.6.0, Select2 |
| **Build** | Single HTML bundle (~28,500 lines), offline-capable SPA |

### Security & Compliance

- **Strict CSP**: Content Security Policy prevents external script injection
- **No External APIs**: All processing happens on-device after initial load
- **Data Isolation**: All data stays on the local device (HIPAA-aligned)
- **Frame Protection**: `frame-ancestors 'none'` prevents embedding
- **Input Sanitization**: All user inputs sanitized before rendering
- **Focus Traps**: Modal dialogs trap keyboard focus for accessibility

---

## 2. Directory Structure

```
Doc-Creator-cleanup-v12/CURRENT-VERSION-v12/
│
├── CareConnect-Pro.html              # 🎯 MAIN APP (~28,500 lines)
├── programs-docs-module.html         # Programs workspace (injected into main app)
├── programs.v2.json                  # Treatment programs database (140+ programs)
│
├── js/                               # JavaScript modules
│   ├── auth/
│   │   └── login-robust.js           # Authentication (PBKDF2, rate limiting, TTL)
│   │
│   ├── programs/                     # Programs module components
│   │   ├── app-controller.js         # Programs UI controller
│   │   ├── document-model.js         # Document generation logic
│   │   ├── map-controller.js         # Leaflet map integration
│   │   ├── map-icons.js              # Custom map markers
│   │   ├── preferences.js            # User preferences storage
│   │   ├── program-core.js           # Programs API (window.ccPrograms)
│   │   ├── program-normalizer.js     # Data normalization utilities
│   │   └── program-types.js          # TypeScript-style type definitions
│   │
│   ├── demo-data.js                  # Demo data generator with scenarios
│   ├── task-service.js               # Task state management bridge
│   ├── data-persistence.js           # Data persistence utilities
│   ├── programs-loader.js            # Programs JSON loader
│   └── programs-init.js              # Programs initialization
│
├── configs/
│   └── task-schema.js                # 🎯 Central task/milestone definitions
│
├── css/                              # Stylesheets
│   ├── theme-tokens.css              # Design system CSS variables
│   ├── client-profile.css            # Profile modal styles
│   ├── app-layout.css                # App shell layout
│   ├── dark-mode.css                 # Dark theme overrides
│   ├── document-generator.css        # Document UI styles
│   └── programs-explorer.css         # Programs module styles
│
├── libs/                             # Third-party libraries (local, no CDN)
│   ├── jspdf.umd.min.js              # PDF generation
│   ├── html2canvas.min.js            # HTML to canvas
│   ├── pdf-lib.min.js                # PDF manipulation
│   ├── leaflet.js / leaflet.css      # Interactive maps
│   ├── chart.min.js                  # Chart.js
│   ├── d3.v7.min.js                  # D3.js visualizations
│   ├── jquery-3.6.0.min.js           # jQuery
│   └── select2.min.js / .css         # Enhanced dropdowns
│
├── assets/
│   └── letterhead/                   # Family First branding
│       ├── ffas-letterhead-header.png
│       └── ffas-letterhead-footer.jpg
│
├── images/
│   ├── family-first-logo.png
│   └── file.svg
│
├── map-v2-dist/                      # Compiled map module
│   ├── assets/
│   │   ├── map-v2.css
│   │   └── map-v2.js
│   ├── index.html
│   └── programs.v2.json
│
├── docs/                             # Documentation
│   ├── QUICK-START-GUIDE.md          # 10-minute user ramp-up
│   ├── DEV-TOOLS.md                  # Developer utilities guide
│   ├── DEMO-DATA-GUIDE.md            # Demo data documentation
│   ├── REFERENCE-CARD.md             # Printable cheat sheet
│   ├── TRAINING-PRESENTATION.md      # 30-minute training script
│   ├── ROLLOUT-CHECKLIST.md          # Launch planning
│   ├── FAQ.md                        # Frequently asked questions
│   ├── SESSION-PERSISTENCE-IMPLEMENTATION.md
│   └── [various checkpoint/audit docs]
│
├── test/                             # Development test harnesses
│   ├── reset-app.html                # Wipe all local data
│   ├── test-session-persistence.html # Auth testing
│   ├── test-demo-data.html           # Demo data testing
│   ├── test-programs-load.html       # Programs loading test
│   ├── test-quick.html               # Quick session test
│   └── fix-logout-issue.html         # Logout debugging
│
├── tools/                            # Data enrichment scripts
│   ├── enrich-batch1_*.js            # Program data enrichment
│   └── enrich-friendship-circle.js
│
├── releases/                         # Stable versioned snapshots
│   └── CareConnect-Pro_v12.3-STABLE/
│
├── [Root-level JS modules]           # See Section 3
├── [Root-level MD files]             # Various documentation
├── server.js                         # Local dev server
├── diagnose.html                     # Diagnostic page
├── smoke-test.html                   # Smoke test page
└── integration-test.html             # Integration test page
```

---

## 3. Core JavaScript Modules

### Client & Data Management

| File | Purpose | Global Export | Key Methods |
|------|---------|---------------|-------------|
| `client-manager.js` | Client CRUD, discharge workflow | `window.clientManager` | `createClient()`, `getClient()`, `updateClient()`, `dischargeClient()`, `getAllClients()`, `getUpcomingDischarges()`, `validateDischargeReadiness()` |
| `indexed-db-manager.js` | IndexedDB wrapper (version 5) | `IndexedDBManager` class | `init()`, `add()`, `get()`, `update()`, `delete()`, `getAll()` |
| `houses-manager.js` | Residential house management | `window.HousesManager` | `getHouses()`, `getHouseById()`, `getHouseOccupancy()`, `getTotalCensus()`, `getAvailableBeds()` |

### Dashboard & Widgets

| File | Purpose | Global Export | Key Components |
|------|---------|---------------|----------------|
| `dashboard-manager.js` | Data aggregation, priority calculation, caching | `window.dashboardManager` | `loadData()`, `loadCriticalAlerts()`, `getQuickWins()`, `getTimeAwareGreeting()` |
| `dashboard-widgets.js` | Individual widget components | `window.dashboardWidgets` | `FlightPlanWidget`, `JourneyRadarWidget`, `CoachScheduleWidget` |
| `morning-review-dashboard.js` | Morning review workflow | — | Morning standup features |

### Tracker System

| File | Purpose | Global Export | Key Methods |
|------|---------|---------------|-------------|
| `tracker-engine.js` | Compliance scoring, gap detection | `window.trackerEngine` | `calculateCompletion()`, `getHouseCompliance()`, `getClientGaps()`, `identifyAtRiskClients()` |
| `tracker-bulk-update.js` | Bulk tracker operations | — | Mass update utilities |
| `tracker-aftercare-cascade.js` | Aftercare task dependencies | — | Auto-creates dependent tasks |
| `tracker-timeline.js` | Timeline visualization | — | Visual timeline rendering |
| `cm-tracker.js` | Case manager tracker view | — | CM-specific tracker UI |
| `cm-tracker-export.js` | Tracker data export | — | Export to CSV/JSON |

### Client Profile & Modals

| File | Purpose | Global Export | Key Methods |
|------|---------|---------------|-------------|
| `client-profile-manager.js` | Modern profile modal (6 tabs) | `window.clientProfileManager` | `open()`, `close()`, `switchTab()`, `renderModal()`, `loadTab()` |
| `outcome-tracking-modal.js` | Discharge outcome capture | `window.outcomeTrackingModal` | `open()`, `close()`, `save()` |
| `discharged-clients-view.js` | Discharged clients database | — | `renderDischargedClients()`, `initDischargedClientsView()` |
| `discharge-checklist.js` | Pre-discharge checklist logic | — | Checklist validation |

### Analytics System

| File | Purpose | Global Export | Key Methods |
|------|---------|---------------|-------------|
| `analytics-db-schema.js` | IndexedDB stores for analytics | — | Schema definitions |
| `analytics-data-capture.js` | Event logging utilities | — | `generateId()`, `getTimestamp()`, `getCurrentUser()` |
| `analytics-export.js` | Export generation, reporting | `window.analyticsExport` | `generateExport()`, `downloadExport()`, `generateSummary()`, `getOutcomeBreakdown()`, `getTopPlacements()`, `getHouseOccupancy()` |
| `analytics-init.js` | Analytics initialization | `window.CareConnectAnalytics` | `init()`, `getSummary()` |
| `analytics-hooks.js` | Integration bridge | `window.analyticsHooks` | `logClientAdmission()`, `logClientDischarge()`, `logDocumentGenerated()`, `completeTask()` |

### Other Modules

| File | Purpose | Global Export |
|------|---------|---------------|
| `feature-flags.js` | Progressive feature rollout | `window.featureFlags` |
| `document-generator.js` | Document workflow orchestration | `window.documentGenerator` |
| `aftercare-manager.js` | Aftercare program options | `window.aftercareManager` |
| `milestones-manager.js` | Client milestone tracking | — |
| `session-fix.js` | Session persistence fixes | — |

---

## 4. IndexedDB Schema

**Database Name**: `CareConnectPro`  
**Version**: 5

### Object Stores

| Store Name | Key Path | Purpose | Indexes |
|------------|----------|---------|---------|
| `programs` | `id` | Treatment program library | name, location, type, coordinates, dataCompleteness |
| `clients` | `id` | Active client records | kipuId, houseId, status, admissionDate |
| `houses` | `id` | Residential houses | name, isActive |
| `documents` | `id` | Generated documents | clientId, type, createdAt |
| `analytics` | `id` | Analytics events | eventType, timestamp |
| `auditLog` | `id` | HIPAA audit trail | action, userId, timestamp |
| `clientMilestones` | `id` | Milestone tracking | clientId, milestoneId |
| `clientAssessments` | `id` | GAD, PHQ, etc. | clientId, assessmentType |
| `clientAftercareOptions` | `id` | Aftercare tracking | clientId |
| `archivedClients` | `id` | Discharged client archive | dischargeDate, outcome |
| `geocache` | `query` | Geocoding cache | timestamp |
| `profiles` | `id` (auto) | User profiles | timestamp, templateName |
| `filters` | `id` (auto) | Saved filter sets | name, timestamp |
| `mapTiles` | — | Offline map tiles | — |

### Analytics-Specific Stores (via analytics-db-schema.js)

| Store Name | Purpose |
|------------|---------|
| `users` | User profiles for attribution |
| `referrals` | Referral tracking |
| `clinical_documents` | Document completion tracking |
| `authorizations` | Insurance authorization tracking |
| `program_relationships` | Program partnership health |
| `tasks` | Task completion tracking |
| `analytics_events` | Append-only event log |
| `export_history` | Export audit trail |

---

## 5. Task Schema System

**File**: `configs/task-schema.js`  
**Global**: `window.TaskSchema`

### Categories

```javascript
categories: {
    admission: {
        label: '48-Hour Admission',
        accent: '#0ea5e9'  // Blue
    },
    aftercare: {
        label: 'Aftercare Planning',
        accent: '#8b5cf6'  // Purple
    },
    clinical: {
        label: 'Clinical Assessments',
        accent: '#10b981'  // Green
    },
    documentation: {
        label: 'Discharge Documentation',
        accent: '#f97316'  // Orange
    },
    asam: {
        label: 'ASAM & LOC',
        accent: '#ef4444'  // Red
    }
}
```

### Tasks

| Task ID | Label | Category | Due |
|---------|-------|----------|-----|
| `needsAssessment` | Needs Assessment | admission | 2 days after admission |
| `healthPhysical` | Health & Physical | admission | 2 days after admission |
| `aftercareThreadSent` | Aftercare Thread Sent | aftercare | 14 days after admission |
| `optionsDocUploaded` | Options Document Uploaded | aftercare | 7 days after thread sent |
| `dischargePacketUploaded` | Discharge Packet Uploaded | aftercare | 2 days before discharge |
| `referralClosureCorrespondence` | Referral Closure | aftercare | 2 days after packet |
| `gadCompleted` | GAD-7 Anxiety Assessment | clinical | 7 days after admission |
| `phqCompleted` | PHQ-9 Depression Screening | clinical | 7 days after admission |
| `satisfactionSurvey` | Satisfaction Survey | clinical | 3 days before discharge |
| `dischargeSummary` | Discharge Summary | documentation | 2 days before discharge |
| `dischargePlanningNote` | Discharge Planning Note | documentation | 2 days before discharge |
| `dischargeASAM` | Discharge ASAM | asam | 2 days before discharge |
| `asamAdmission` | Admission ASAM | asam | 3 days after admission |
| `asamContinued` | Continued Stay ASAM | asam | 14 days after admission |
| `asamStepDown` | Step-Down ASAM | asam | On LOC change |

### Due Date Types

| Type | Description |
|------|-------------|
| `afterAdmission` | X days after client admission date |
| `beforeDischarge` | X days before planned discharge date |
| `afterTaskComplete` | X days after a dependency task completes |

### Task Dependencies

```
aftercareThreadSent
    └── optionsDocUploaded (autoCreates)
            └── dischargePacketUploaded (autoCreates)
                    └── referralClosureCorrespondence (autoCreates)
```

---

## 6. Houses & Capacity

### Family First Houses

| House | ID | Capacity | Sub-Units | Program Type |
|-------|-----|----------|-----------|--------------|
| **NEST** | `house_nest` | 20 | Preserve (12), Prosperity (8) | Neurodivergent |
| **Cove** | `house_cove` | 15 | Unit A (8), Unit B (7) | Residential |
| **Hedge** | `house_hedge` | 12 | — | Residential |
| **Meridian** | `house_meridian` | 10 | — | Residential |
| **Banyan** | `house_banyan` | 10 | — | Residential |
| **TOTAL** | — | **67** | — | — |

### House ID Mapping

When displaying house names in the UI, use friendly names:

```javascript
const houseDisplayNames = {
    'house_nest': 'NEST',
    'house_cove': 'Cove',
    'house_hedge': 'Hedge',
    'house_meridian': 'Meridian',
    'house_banyan': 'Banyan',
    'nest_preserve': 'Preserve (NEST)',
    'nest_prosperity': 'Prosperity (NEST)',
    'cove_unit_a': 'Cove Unit A',
    'cove_unit_b': 'Cove Unit B',
    // Legacy mappings
    'house_preserve': 'Preserve',
    'house_prosperity': 'Prosperity'
};
```

### Notes

- **NEST** is the neurodivergent program, still under Family First umbrella
- **Cove** has 3 townhomes: Unit A & B house clients, Unit C is school/group (not beds)
- Preserve and Prosperity as standalone houses are deprecated—they're NEST sub-units

---

## 7. UI Workspaces

### Dashboard (`#dashboardTab`)

The Coach Mission Control dashboard provides real-time operational visibility.

#### Daily Flight Plan Widget
Priority task queue organized by urgency zones:

| Zone | Color | Meaning | Action |
|------|-------|---------|--------|
| **Red** | 🔴 | Immediate action required | Act now |
| **Purple** | 🟣 | Discharge prep needed | Prepare discharge |
| **Yellow** | 🟡 | Due today | Complete today |
| **Green** | 🟢 | Upcoming tasks | Plan ahead |

#### Client Journey Radar Widget
Visual representation of client progression:

```
Week 1 → Day 14-16 → Day 30 → 45+ Days → Discharge Pipeline → Recently Discharged
```

- **Day 14-16**: Critical aftercare window (thread must be sent)
- **Discharge Pipeline**: Clients with upcoming discharge dates

#### House Tracker Compliance Widget
Per-house completion scores showing:
- Overall compliance percentage
- Critical items completion
- At-risk client count
- Strong performers count

#### Coach Schedule Widget
- Today's prioritized tasks
- Upcoming week tasks
- Quick wins (fast completable items)

---

### Programs & Docs (`#programsTab`)

Three-pane explorer for treatment program research and document creation.

#### Left Pane: Filters
- Program type (Residential, PHP, IOP, etc.)
- Location/distance
- Insurance accepted
- Specialties
- Age range

#### Center Pane: Results
- Program cards with key details
- Map view toggle (Leaflet)
- Compare functionality

#### Right Pane: Document Builder
- Selected programs list
- At-home recommendations
- Alumni services
- Document preview
- Export to PDF

---

### Clients (`#clientsTab`)

Client roster and management interface.

#### Tab Navigation
- **Active Clients**: Current census
- **Discharged Clients**: Historical archive

#### Client Cards
- Initials, Kipu ID, house assignment
- Days in care
- Completion percentage
- Quick actions (View Profile, Create Document)

#### Modern Profile Modal (6 Tabs)

| Tab | Content |
|-----|---------|
| **Tracking** | Task checklist by category (Admission, Aftercare, ASAM) |
| **Assessments** | Clinical assessments (GAD-7, PHQ-9, Satisfaction) |
| **Aftercare** | Aftercare roadmap with progress visualization |
| **Team** | Care team members and roles |
| **Timeline** | Activity timeline and milestones |
| **Notes** | Clinical notes and observations |

---

### Admin Command Center (`#adminTab`)

Executive dashboard for supervisors and administrators.

#### KPI Cards (Top Row)
| KPI | Description |
|-----|-------------|
| Aftercare Plans | Documents created in period |
| Successful Placements | Confirmed program placements |
| Placement Rate | Plans → Placements conversion |
| Doc Compliance | On-time document completion % |
| Discharge Packets | Completed & uploaded packets |
| Tasks Completed | Tasks finished in period |
| Active Census | Current clients vs capacity |

#### Business Development Panel
- **Top Placement Destinations**: Most-used programs
- **Discharge Outcomes Donut**: Program / Home w/ Supports / Clinician Rec / AMA
- **Decline Reasons**: Why programs were not selected
- **Time to Admission**: Average, median, longest wait times

#### Clinical Operations Panel
- **Document Compliance**: On-time, late, overdue breakdown
- **Discharge Packets**: Completion status tracking
- **Authorization Performance**: By payer approval rates
- **Client Journey**: Census, avg LOS, destinations

#### House Occupancy Panel
- Per-house progress bars
- Sub-unit breakdown (NEST, Cove)
- Available beds count

#### Export & Reports Tab
- Export type selection (Full, Summary, Anonymized)
- Date range filtering
- Download JSON / Copy to clipboard
- Export history

---

## 8. Key Global Objects

### Core Managers

```javascript
window.clientManager         // Client CRUD operations
window.taskService           // Task state management bridge
window.dashboardManager      // Dashboard data aggregation
window.clientProfileManager  // Profile modal controller
window.HousesManager         // House management (class, needs instantiation)
window.housesManager         // House manager instance
```

### Programs Module

```javascript
window.ccPrograms            // Programs API (filtering, searching)
window.programsData          // Raw programs array from JSON
window.ccProgramNormalizer   // Data normalization utilities
window.ccDocumentModel       // Document generation logic
```

### Analytics

```javascript
window.CareConnectAnalytics  // Analytics API
window.analyticsExport       // Reporting and export
window.analyticsHooks        // Integration helpers for logging
```

### UI & Widgets

```javascript
window.dashboardWidgets      // Widget instances Map
window.featureFlags          // Feature toggle system
window.metricHelp            // Metric descriptions registry
window.attachMetricTooltips  // Tooltip hydration function
window.outcomeTrackingModal  // Discharge outcome modal
window.documentGenerator     // Document workflow controller
```

### Shell & Navigation

```javascript
window.ccShell               // Header/nav controller
window.switchTab             // Tab navigation function
window.ccConfig              // Global config object
window.ccConfig.demoMode     // Boolean: demo vs production
window.ccConfig.currentUser  // Current user object
```

### Tracker

```javascript
window.trackerEngine         // Compliance calculation engine
window.TaskSchema            // Task definitions
```

---

## 9. Metric Tooltip System

### Overview

A centralized system for providing hover explanations on metrics throughout the app.

### Registry (`window.metricHelp`)

```javascript
window.metricHelp = {
    // ═══════════════════════════════════════════════════════════════
    // ADMIN COMMAND CENTER (acc_*)
    // ═══════════════════════════════════════════════════════════════
    acc_aftercare_plans: 'Number of aftercare planning documents created in the selected date range.',
    acc_successful_placements: 'Clients whose aftercare outcome is a confirmed program placement or home-with-supports transition.',
    acc_placement_rate: 'Successful placements divided by total aftercare plans in this date range.',
    acc_doc_compliance: 'Percent of required documents completed on or before their due date.',
    acc_discharge_packets: 'Clients whose discharge packet is completed and uploaded during this period.',
    acc_tasks_completed: 'Tasks marked complete during the selected date range.',
    acc_active_census: 'Active clients compared to total bed capacity across all houses.',

    // Panel descriptions
    acc_doc_panel: 'On-time, late, and overdue documents, grouped by document type.',
    acc_packets_panel: 'Completion and upload status for discharge packets and aftercare documents.',
    acc_auth_panel: 'Authorization requests grouped by payer with approval rates.',
    acc_journey_panel: 'Current census, average length of stay, and discharge destinations.',
    acc_house_occupancy_panel: 'Real-time bed usage and capacity by house.',

    // ═══════════════════════════════════════════════════════════════
    // COACH DASHBOARD (dash_*) - Use conversational language
    // ═══════════════════════════════════════════════════════════════
    dash_tracker_overall: 'Big picture of how many key checkboxes are turned on for your houses. Higher = fewer loose ends.',
    dash_tracker_critical: 'Out of the urgent checklist items, what percent are done on time.',
    dash_tracker_at_risk: 'Kids who are close to discharge and still missing something important.',
    dash_tracker_strong: 'Houses where most trackers are green — roughly 80% or more complete.',
    dash_flight_plan: 'Today's to-do list grouped by urgency: red = must act now, purple = discharge prep, yellow = due today, green = coming up soon.',
    dash_journey_radar: 'Counts of clients in each phase to show who needs aftercare or discharge work.',

    // ═══════════════════════════════════════════════════════════════
    // CLIENT PROFILE (client_*)
    // ═══════════════════════════════════════════════════════════════
    client_days_in_care: 'How long this client has been in treatment, from admission to today.',
    client_completion_pct: 'Percent of key trackers checked off. Higher = fewer open items before discharge.'
};
```

### Usage

1. **Add `data-metric` attribute** to any element:
```html
<span class="metric-info" data-metric="acc_aftercare_plans">i</span>
```

2. **Call `attachMetricTooltips()`** after dynamic rendering:
```javascript
this.container.innerHTML = html;
if (window.attachMetricTooltips) {
    window.attachMetricTooltips(this.container);
}
```

### Naming Conventions

| Prefix | Audience | Tone |
|--------|----------|------|
| `acc_` | Admin Command Center | Analytical, precise |
| `dash_` | Coach Dashboard | Conversational, simple |
| `client_` | Client Profile | Clear, actionable |

---

## 10. Authentication System

**File**: `js/auth/login-robust.js`

### Credentials (Development)

| Account | Username | Password | Role |
|---------|----------|----------|------|
| Master Admin | `MasterAdmin` | `FFA@dm1n2025!` | admin |
| Doc Creator | `Doc232` | `FFA121` | admin |

### Session Storage Keys

| Key | Purpose |
|-----|---------|
| `isLoggedIn` | Boolean login state |
| `username` | Current username |
| `fullName` | Display name |
| `userRole` | 'admin' or 'user' |
| `userInitials` | Two-letter initials |
| `loginExpires` | Session expiration timestamp |
| `currentUser` | JSON object with all user data |
| `currentUserId` | User ID |
| `currentUserName` | User name |
| `currentUserEmail` | User email |
| `currentUserRole` | User role |

### Configuration

```javascript
const CONFIG = {
    SESSION_TTL_MINUTES: 120,        // 2-hour session
    MAX_ATTEMPTS: 5,                  // Rate limiting
    LOCK_SECONDS: 60,                 // Lockout duration
    PBKDF2_ITERATIONS: 100000,        // Password hashing
};
```

### Security Features

- **PBKDF2 Password Hashing**: 100,000 iterations with SHA-256
- **Rate Limiting**: 5 attempts before 60-second lockout
- **Session TTL**: 2-hour expiration
- **Unified User Context**: `window.ccConfig.currentUser` synced with localStorage

---

## 11. Demo Data System

**File**: `js/demo-data.js`

### Scenarios

```javascript
DemoDataGenerator.scenarios = {
    balanced: {
        // Default mix of stages and compliance
        stageWeights: { new: 0.2, week1: 0.2, week2: 0.2, week3: 0.15, discharge: 0.15, discharged: 0.1 },
        compliance: { critical: 0.7, assessments: 0.6, aftercare: 0.5, docs: 0.4 }
    },
    highCensus: {
        // 80% active clients
        stageWeights: { new: 0.3, week1: 0.25, week2: 0.25, week3: 0.1, discharge: 0.05, discharged: 0.05 },
        compliance: { critical: 0.8, assessments: 0.7, aftercare: 0.6, docs: 0.5 }
    },
    lowCompliance: {
        // Many incomplete trackers
        stageWeights: { new: 0.15, week1: 0.2, week2: 0.25, week3: 0.2, discharge: 0.1, discharged: 0.1 },
        compliance: { critical: 0.3, assessments: 0.2, aftercare: 0.2, docs: 0.1 }
    },
    dischargeHeavy: {
        // Many in discharge pipeline
        stageWeights: { new: 0.05, week1: 0.1, week2: 0.15, week3: 0.2, discharge: 0.35, discharged: 0.15 },
        compliance: { critical: 0.9, assessments: 0.85, aftercare: 0.8, docs: 0.7 }
    }
};
```

### Console Commands

```javascript
// Generate demo clients with current scenario
window.populateDemoClients()

// Change scenario before generating
window.setDemoScenario('highCensus')
window.populateDemoClients()

// Clear all data
window.clearAllData()

// Force demo data regeneration
window.forceDemoData()
```

### Admin Command Center Toggle

The Demo Scenario dropdown in the ACC header allows selecting scenarios without console access.

---

## 12. Feature Flags

**File**: `feature-flags.js`  
**Global**: `window.featureFlags`

### Categories

| Category | Description |
|----------|-------------|
| `core` | Always-available base features |
| `clients` | Client management features |
| `analytics` | Reporting and visualization |
| `programs` | Program search and documents |
| `ai` | AI-assisted features (needs backend) |
| `sync` | Multi-device synchronization (needs backend) |
| `performance` | Performance optimizations |

### Key Flags

| Flag | Enabled | Backend Required | Risk |
|------|---------|------------------|------|
| `programsV2Core` | ✅ | No | LOW |
| `enableDischargeWorkflow` | ✅ | No | LOW |
| `enableDischargedArchive` | ✅ | No | LOW |
| `enableOutcomeTracking` | ✅ | No | LOW |
| `enableHouseOccupancy` | ✅ | No | LOW |
| `enableOutcomeAnalytics` | ✅ | No | LOW |
| `enableAdvancedVisualizations` | ❌ | No | MEDIUM |
| `enablePredictiveAnalytics` | ❌ | Yes | HIGH |
| `enableMultiDeviceSync` | ❌ | Yes | HIGH |
| `enableAIAssist` | ❌ | Yes | HIGH |
| `enableVoiceCommands` | ❌ | Yes | HIGH |

### Risk Levels

| Level | Meaning |
|-------|---------|
| **LOW** | Stable, well-tested, safe to enable |
| **MEDIUM** | Tested but may have edge cases |
| **HIGH** | Experimental or requires backend |

### Usage

```javascript
// Check if feature is enabled
if (window.featureFlags.isEnabled('enableDischargeWorkflow')) {
    // Show discharge features
}

// Show feature flags panel
window.featureFlags.showPanel()
```

---

## 13. Document Generation

**Files**: `document-generator.js`, `js/programs/document-model.js`

### Document Types

| Type | ID | When Used | Purpose |
|------|-----|-----------|---------|
| **Aftercare Options** | `aftercare-options` | Week 5 | Compare programs for family |
| **Aftercare Plan** | `aftercare-plan` | At discharge | Finalized placement |

### Document Sections

1. **Header**: Personalized greeting with client initials
2. **Program Options**: Selected treatment programs with details
3. **At-Home Recommendations**: If extended care not viable
4. **Alumni Services**: Parent Focus Group, Alumni Programming, NEST Alumni

### Generation Flow

```
1. Select client → Create Document
2. Choose document type
3. Select programs from search/comparison
4. Add at-home recommendations (optional)
5. Include alumni services (optional)
6. Preview with letterhead
7. Export PDF
8. Outcome tracking modal opens (for Aftercare Plan)
```

### Letterhead

- **Header**: `assets/letterhead/ffas-letterhead-header.png`
  - Centered on page
  - Full width
- **Footer**: `assets/letterhead/ffas-letterhead-footer.jpg`
  - Larger size for visibility
  - Contains contact information

### PDF Export

Uses jsPDF + html2canvas:
1. Render document HTML to hidden div
2. Include letterhead images
3. Capture with html2canvas
4. Generate PDF with jsPDF
5. Download file

---

## 14. Programs Module

**Files**: `programs-docs-module.html`, `js/programs/*.js`

### Architecture

```
window.ccPrograms (program-core.js)
├── core[]           - All normalized programs
├── parents[]        - Umbrella parent programs
├── childrenMap      - Map<parentId, children[]>
├── init()           - Initialize from programsData
├── search()         - Text search
├── filter()         - Apply filter criteria
├── getById()        - Get single program
└── calculateDistance() - Distance from home location
```

### Program Data Structure

```javascript
{
    id: "prog_123",
    name: "Example Treatment Center",
    type: "Residential",
    location: {
        city: "Palm Beach",
        state: "FL",
        address: "123 Main St"
    },
    coordinates: { lat: 26.7153, lng: -80.0534 },
    contact: {
        phone: "(555) 123-4567",
        email: "info@example.com",
        website: "https://example.com"
    },
    insurance: ["Aetna", "BlueCross", "Cigna"],
    specialties: ["Substance Abuse", "Mental Health", "Trauma"],
    ageRange: { min: 12, max: 17 },
    gender: "Co-ed",
    accreditations: ["JCAHO", "CARF"],
    dataCompleteness: 85,
    isUmbrellaParent: false,
    parentId: null
}
```

### Filter Types

| Filter | Type | Description |
|--------|------|-------------|
| `type` | Multi-select | Program type (Residential, PHP, IOP, etc.) |
| `distance` | Range | Miles from home location |
| `insurance` | Multi-select | Accepted insurance providers |
| `specialties` | Multi-select | Treatment specialties |
| `ageRange` | Range | Client age compatibility |
| `gender` | Single-select | Gender served |
| `state` | Multi-select | State location |

### Map Integration

- **Library**: Leaflet.js
- **Tiles**: OpenStreetMap
- **Features**: Program markers, clustering, popups, distance circles

---

## 15. Analytics System

### Architecture

```
analytics-init.js
├── Initializes IndexedDB stores
├── Sets device ID
└── Exposes window.CareConnectAnalytics

analytics-data-capture.js
├── generateId()        - Unique ID generation
├── getTimestamp()      - ISO 8601 timestamps
├── getCurrentUser()    - User attribution
└── Logging utilities

analytics-hooks.js
├── logClientAdmission()
├── logClientDischarge()
├── logDocumentGenerated()
├── completeTask()
├── registerUserProfile()
└── [other event hooks]

analytics-export.js
├── generateExport()        - Full data export
├── downloadExport()        - File download
├── generateSummary()       - Dashboard summary
├── getOutcomeBreakdown()   - Discharge outcomes
├── getTopPlacements()      - Popular programs
├── getAtHomeResourceUsage()
├── getAverageLengthOfStay()
├── getHouseOccupancy()
├── getAssessmentsDue()
├── getAftercareProgress()
├── getDischargeReadiness()
└── getFrequentCustomPrograms()
```

### Event Types

| Event | When Logged |
|-------|-------------|
| `client_admission` | New client created |
| `client_discharge` | Client discharged |
| `document_generated` | Document created |
| `document_completed` | Document finalized |
| `task_completed` | Task marked complete |
| `referral_created` | Program referral made |
| `referral_status_change` | Referral status updated |
| `user_registered` | New user account |

### Export Format

```javascript
{
    metadata: {
        exportDate: "2025-11-27T10:30:00-05:00",
        exportType: "full",
        deviceId: "dev_abc123",
        dateRange: { start: "2025-11-01", end: "2025-11-27" }
    },
    recordCounts: {
        users: 5,
        referrals: 42,
        clinical_documents: 38,
        tasks: 156,
        analytics_events: 892
    },
    data: {
        users: [...],
        referrals: [...],
        // etc.
    }
}
```

---

## 16. Tracker System

### TrackerEngine (`tracker-engine.js`)

```javascript
class TrackerEngine {
    requirements: [
        { id: 'needsAssessment', critical: true, category: 'admission', dueByDay: 2 },
        { id: 'healthPhysical', critical: true, category: 'admission', dueByDay: 2 },
        // ... all tracker requirements
    ]
    
    calculateCompletion(client)      // Returns { overall, byCategory, gaps }
    getHouseCompliance(clients)      // Returns house-level stats
    getClientGaps(client)            // Returns missing items
    identifyAtRiskClients(clients)   // Returns at-risk list
    generateTasksFromGaps(client)    // Creates tasks for gaps
}
```

### Compliance Scoring

```javascript
{
    overall: 75,              // Overall completion %
    byCategory: {
        admission: { completed: 2, total: 2, percentage: 100 },
        aftercare: { completed: 1, total: 4, percentage: 25 },
        clinical: { completed: 2, total: 3, percentage: 67 },
        documentation: { completed: 0, total: 3, percentage: 0 }
    },
    criticalCompliance: 80,   // Critical items only
    atRiskClients: [...],     // Clients needing attention
    strongClients: [...]      // High performers
}
```

### Risk Classification

| Risk Level | Criteria |
|------------|----------|
| **Critical** | Discharge within 7 days + missing critical items |
| **At Risk** | Discharge within 14 days + <50% completion |
| **Watch** | <60% completion overall |
| **Strong** | ≥80% completion |

---

## 17. Discharge Workflow

### Pre-Discharge (48 Hours)

1. **Automatic Alerts**: Dashboard shows discharge prep items
2. **Checklist Validation**: System checks required items:
   - Discharge packet uploaded
   - Discharge summary complete
   - Discharge planning note done
   - Discharge ASAM completed
   - Satisfaction survey done

### Discharge Readiness Validation

```javascript
const readiness = await clientManager.validateDischargeReadiness(clientId);
// Returns:
{
    ready: false,
    blockers: [
        { type: 'document', id: 'dischargePacketUploaded', label: 'Discharge Packet' },
        { type: 'task', id: 'dischargeSummary', label: 'Discharge Summary' }
    ],
    warnings: [
        { type: 'assessment', id: 'satisfactionSurvey', label: 'Satisfaction Survey' }
    ]
}
```

### Blocker Modal

If blockers exist, shows modal with:
- List of incomplete items
- Admin override option (with reason logging)
- "Complete Items" action buttons

### Outcome Tracking Modal

Triggered after Aftercare Plan export:

1. **Step 1**: Family Compliance
   - Following primary recommendation
   - Following at-home recommendation
   - Clinician-recommended plan
   - AMA / No plan

2. **Step 2a**: Program Selection (if program placement)
   - Select from document programs
   - Add custom program entry

3. **Step 2b**: At-Home Resources (if home with supports)
   - List resources being used
   - Add custom resources

4. **Step 2c**: Clinician Recommendation (if clinician rec)
   - Document rationale
   - Specify recommended resources

### Discharged Clients Database

- Filterable by date range, outcome type, house
- Searchable by initials or Kipu ID
- Read-only profile view
- CSV export capability

---

## 18. Design System & Styling

### CSS Variables (`css/theme-tokens.css`)

```css
:root {
    /* Colors */
    --brand-primary: #6366f1;
    --brand-secondary: #8b5cf6;
    --status-green: #22c55e;
    --status-yellow: #f59e0b;
    --status-red: #ef4444;
    
    /* Backgrounds */
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-card: #1e293b;
    
    /* Text */
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    
    /* Spacing */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-4: 1rem;
    --space-6: 1.5rem;
    
    /* Radii */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-full: 999px;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
    --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
    
    /* Shell offsets */
    --app-shell-top-offset: 56px;
    --app-shell-total-header: 112px;
    --app-shell-header-z: 1000;
}
```

### Component Classes

#### Admin Command Center
```css
.acc-container      /* Main container */
.acc-header         /* Header section */
.acc-kpis           /* KPI cards row */
.acc-kpi            /* Individual KPI card */
.acc-kpi__info      /* Info icon (16px circle) */
.acc-tabs           /* Tab navigation */
.acc-panel          /* Tab content panel */
.acc-card           /* Content card */
.acc-card__info     /* Card header info icon */
.acc-table          /* Data table */
.acc-grid           /* Grid layout */
.acc-col-*          /* Grid columns (4, 6, 8, 12) */
```

#### Dashboard Widgets
```css
.widget-header      /* Widget header */
.widget-header-actions  /* Header action buttons */
.metric-info        /* Info icon */
.priority-zone      /* Flight plan zone */
.zone-red, .zone-purple, .zone-yellow, .zone-green
.journey-segment    /* Journey radar segment */
.compliance-widget  /* Tracker compliance */
.house-card         /* House compliance card */
```

#### Client Profile
```css
.profile-modal-overlay  /* Modal backdrop */
.profile-modal          /* Modal container */
.profile-sidebar        /* Left navigation */
.profile-main           /* Main content area */
.profile-hero           /* Hero section with gradient */
.hero-stat-card         /* Stat cards with frosted glass */
.profile-content        /* Tab content area */
.profile-card           /* Content cards */
.checklist-grid         /* Task checklist */
.check-item             /* Individual task item */
```

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Indigo | `#6366f1` | Primary brand, buttons |
| Purple | `#8b5cf6` | Secondary, gradients |
| Violet | `#a855f7` | Accents |
| Blue | `#3b82f6` | Links, info states |
| Green | `#22c55e` | Success, completion |
| Yellow | `#f59e0b` | Warning, attention |
| Red | `#ef4444` | Error, critical |
| Slate | `#0f172a` → `#f1f5f9` | Backgrounds, text |

### Gradients

```css
/* Hero gradient */
background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 35%, #a855f7 60%, #3b82f6 100%);

/* Button gradient */
background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);

/* Dark card gradient */
background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
```

### Frosted Glass Effect

```css
.hero-stat-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}
```

---

## 19. Development Workflow

### Starting the Development Server

```bash
# Option 1: Node.js http-server
cd Doc-Creator-cleanup-v12/CURRENT-VERSION-v12
npx http-server . --port 8080 --cors

# Option 2: Python
cd Doc-Creator-cleanup-v12/CURRENT-VERSION-v12
python -m http.server 8000

# Option 3: Built-in server
cd Doc-Creator-cleanup-v12/CURRENT-VERSION-v12
node server.js

# Option 4: Windows batch file
Start-Server.bat
```

### Accessing the App

```
http://localhost:8080/CareConnect-Pro.html
http://localhost:8000/CareConnect-Pro.html
```

### Debug Mode

```javascript
// Enable via URL
http://localhost:8080/CareConnect-Pro.html?debug=1

// Enable via console
localStorage.setItem('cc-debug', 'true');

// Check status
console.log(window.DEBUG);
```

### Test Pages

| Page | URL | Purpose |
|------|-----|---------|
| Reset App | `/test/reset-app.html` | Wipe all local data |
| Session Test | `/test/test-session-persistence.html` | Auth testing |
| Demo Data | `/test/test-demo-data.html` | Demo data testing |
| Programs Load | `/test/test-programs-load.html` | Programs module test |
| Quick Test | `/test/test-quick.html` | Quick session check |
| Logout Fix | `/test/fix-logout-issue.html` | Logout debugging |

### Console Utilities

```javascript
// Data Management
window.populateDemoClients()      // Generate demo clients
window.clearAllData()             // Reset everything
window.setDemoScenario('highCensus')  // Change scenario

// Dashboard
window.dashboardManager.loadData()    // Refresh dashboard
window.refreshAdminAnalytics()        // Refresh ACC

// Client Management
window.clientManager.getAllClients()  // List all clients
window.clientManager.getClient(id)    // Get specific client

// Feature Flags
window.featureFlags.showPanel()       // Show flags panel
window.featureFlags.isEnabled('flag') // Check flag status

// Debug
window.ccConfig                       // View global config
window.dashboardState                 // View dashboard state
```

### Browser DevTools Tips

1. **Application Tab**: Inspect IndexedDB stores
2. **Console**: Run utility commands
3. **Network Tab**: Verify no external requests (HIPAA)
4. **Elements Tab**: Inspect/modify DOM
5. **Sources Tab**: Debug JavaScript

---

## 20. Conventions & Standards

### ID Generation

**Format**: `{prefix}_{timestamp36}-{random}-{deviceId4}`

```javascript
// Example: cli_abc123-xyz-dev1
const id = generateId('cli');  // Uses analytics-data-capture.js
```

**Prefixes**:
| Prefix | Entity |
|--------|--------|
| `cli` | Client |
| `doc` | Document |
| `task` | Task |
| `prog` | Program |
| `user` | User |
| `evt` | Event |

### Timestamps

**Format**: ISO 8601 with timezone

```javascript
// Example: 2025-11-27T10:30:00-05:00
const timestamp = new Date().toISOString();
```

### User Attribution

Every record should include:

```javascript
{
    createdBy: userId,
    createdAt: timestamp,
    updatedAt: timestamp,
    updatedBy: userId  // On updates
}
```

### Metric Key Naming

| Prefix | Context | Tone |
|--------|---------|------|
| `acc_` | Admin Command Center | Analytical, precise |
| `dash_` | Coach Dashboard | Conversational, coach-friendly |
| `client_` | Client Profile | Clear, actionable |

### CSS Class Naming

- **BEM-style** for components: `.block__element--modifier`
- **Prefixes** for context:
  - `.acc-` Admin Command Center
  - `.profile-` Client Profile
  - `.widget-` Dashboard widgets
  - `.zone-` Priority zones

### File Naming

- **JavaScript**: `kebab-case.js` (e.g., `client-manager.js`)
- **CSS**: `kebab-case.css` (e.g., `client-profile.css`)
- **HTML**: `PascalCase.html` for main files (e.g., `CareConnect-Pro.html`)

### Code Style

- **ES6+**: Use modern JavaScript features
- **IIFE**: Wrap modules in immediately-invoked function expressions
- **Strict Mode**: Always `'use strict';`
- **Comments**: JSDoc style for functions

```javascript
/**
 * Calculate client completion percentage
 * @param {Object} client - Client object with taskState
 * @returns {number} Completion percentage (0-100)
 */
function calculateCompletion(client) {
    'use strict';
    // Implementation
}
```

---

## 21. Common Tasks

### Add a New KPI to Admin Command Center

1. **Add HTML** in `CareConnect-Pro.html` (~line 45200):
```html
<div class="acc-kpi acc-kpi--newkpi">
    <div class="acc-kpi__header">
        <span class="acc-kpi__label">New KPI Name</span>
        <span class="acc-kpi__info" data-metric="acc_new_kpi">i</span>
        <span class="acc-kpi__trend acc-kpi__trend--neutral" id="accKpiNewTrend">—</span>
    </div>
    <div class="acc-kpi__value" id="accKpiNew">--</div>
    <div class="acc-kpi__subtitle">Description</div>
</div>
```

2. **Add metric description** to `window.metricHelp`:
```javascript
acc_new_kpi: 'Description of what this KPI measures.'
```

3. **Add refresh logic** in `refreshAdminAnalytics()` (~line 46900):
```javascript
const newValue = await calculateNewKpi();
updateTextContent('accKpiNew', newValue);
```

### Add a Dashboard Widget

1. **Create widget class** in `dashboard-widgets.js`:
```javascript
class NewWidget extends DashboardWidget {
    constructor(container) {
        super('newWidget', container);
    }

    async render() {
        this.showLoading();
        try {
            const data = await this.getData();
            this.container.innerHTML = `
                <div class="new-widget">
                    <div class="widget-header">
                        <h3>📊 New Widget</h3>
                        <span class="metric-info" data-metric="dash_new_widget">i</span>
                    </div>
                    <!-- Widget content -->
                </div>
            `;
            if (window.attachMetricTooltips) {
                window.attachMetricTooltips(this.container);
            }
            this.hideLoading();
        } catch (error) {
            console.error('Failed to render:', error);
        }
    }
}
```

2. **Register widget**:
```javascript
dashboardWidgets.widgets.set('newWidget', new NewWidget(container));
```

3. **Add metric description**:
```javascript
dash_new_widget: 'Coach-friendly explanation of this widget.'
```

### Modify Client Profile

1. **Edit `client-profile-manager.js`**

2. **For hero section changes**: Modify `renderModal()` method

3. **For tab content**: Modify the appropriate `render*Tab()` method:
   - `renderTrackingTab()`
   - `renderAssessmentsTab()`
   - `renderAftercareTab()`
   - `renderTeamTab()`
   - `renderTimelineTab()`
   - `renderNotesTab()`

4. **Add new tab**: Update `switchTab()` and add new `render*Tab()` method

### Add Analytics Event Logging

1. **Use existing hooks**:
```javascript
window.analyticsHooks.logClientAdmission(clientId, clientData);
window.analyticsHooks.logDocumentGenerated(docType, clientId, docData);
window.analyticsHooks.completeTask(taskId, clientId, taskData);
```

2. **Query analytics**:
```javascript
const summary = await window.analyticsExport.generateSummary();
const outcomes = await window.analyticsExport.getOutcomeBreakdown();
```

### Update House Capacity

Edit `houses-manager.js` → `defaultHouses` array:

```javascript
this.defaultHouses = [
    { 
        id: 'house_new', 
        name: 'New House', 
        displayOrder: 6, 
        isActive: true,
        capacity: 10,
        programType: 'residential'
    },
    // ... existing houses
];
```

### Add a New Task to Schema

Edit `configs/task-schema.js`:

```javascript
newTask: {
    id: 'newTask',
    label: 'New Task Name',
    category: 'aftercare',  // or admission, clinical, documentation, asam
    description: 'Description of what this task involves.',
    due: { type: 'afterAdmission', days: 10 },
    dependsOn: ['previousTask'],  // Optional
    defaultOwnerRole: 'clinicalCoach',
    legacyField: 'newTask',
    legacyDateField: 'newTaskDate',
    autoCreates: ['nextTask']  // Optional
}
```

---

## 22. Pending Work

### In Progress

- ⏳ **Assessments Due Panel**: Aggregation and visualization
- ⏳ **Aftercare Progress Panel**: Outcome tracking visualization
- ⏳ **Discharge Ready List**: Next 7 days discharge candidates

### Planned

- 📋 Authorization logging UI for manual entry
- 📋 Document compliance wiring to TaskSchema due dates
- 📋 Explicit discharge packet tracking in workflow

### Future (Requires Backend)

- 🔮 Multi-device synchronization
- 🔮 AI-assisted recommendations
- 🔮 Voice commands
- 🔮 Family portal
- 🔮 EMR integrations
- 🔮 Insurance authorization automation
- 🔮 Mobile app

---

## 23. Troubleshooting

### Common Issues

#### White Screen on Load
1. Check browser console for errors
2. Try `test/reset-app.html` to clear corrupted data
3. Verify all script files are loading

#### Login Not Working
1. Check rate limiting (5 attempts = 60s lockout)
2. Verify credentials: `MasterAdmin` / `FFA@dm1n2025!`
3. Clear localStorage and try again

#### Dashboard Not Showing Data
1. Run `window.populateDemoClients()` to generate demo data
2. Check `window.dashboardManager.cache` for data
3. Run `window.dashboardManager.loadData()` to refresh

#### Programs Not Loading
1. Check console for `programs.v2.json` load errors
2. Verify `window.programsData` is populated
3. Run `window.ccPrograms.init()` if needed

#### Client Profile Not Opening
1. Verify `window.clientProfileManager` exists
2. Check for ID collision issues in DOM
3. Look for CSS conflicts in `programs-explorer.css`

### Debug Commands

```javascript
// Check system state
console.log('Config:', window.ccConfig);
console.log('Dashboard:', window.dashboardManager?.cache);
console.log('Clients:', await window.clientManager?.getAllClients());
console.log('Programs:', window.programsData?.length);

// Reset specific components
window.dashboardManager.loadData();  // Refresh dashboard
window.refreshAdminAnalytics();      // Refresh ACC
window.ccPrograms.init();            // Reinitialize programs

// Full reset
window.clearAllData();
location.reload();
```

### Browser Caching Issues

If CSS/JS changes aren't appearing:

1. **Hard refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear cache**: DevTools → Application → Clear storage
3. **Add cache buster**: `?v=timestamp` to file URLs

---

## 24. Questions to Ask

Before making any changes, consider:

### Scope Questions
1. "Which file(s) should I modify for this change?"
2. "Is there an existing pattern I should follow?"
3. "Will this change affect other components?"

### Audience Questions
4. "Is this admin-facing or coach-facing?"
5. "What tone should the copy use?"
6. "Does this need a metric tooltip?"

### Integration Questions
7. "Should this log to analytics?"
8. "Does this need feature flag protection?"
9. "Will this work offline?"

### Testing Questions
10. "How can I test this with demo data?"
11. "What edge cases should I consider?"
12. "Does this need to work in both light/dark modes?"

---

## Quick Reference

### Key Files
- **Main App**: `CareConnect-Pro.html`
- **Task Schema**: `configs/task-schema.js`
- **Client Manager**: `client-manager.js`
- **Dashboard**: `dashboard-manager.js`, `dashboard-widgets.js`
- **Profile Modal**: `client-profile-manager.js`
- **Analytics**: `analytics-*.js`

### Key Globals
- `window.clientManager`
- `window.dashboardManager`
- `window.clientProfileManager`
- `window.ccPrograms`
- `window.TaskSchema`
- `window.metricHelp`
- `window.ccConfig`

### Console Commands
- `window.populateDemoClients()`
- `window.clearAllData()`
- `window.refreshAdminAnalytics()`
- `window.featureFlags.showPanel()`

---

**Current Working Directory**: `Doc-Creator-cleanup-v12/CURRENT-VERSION-v12/`  
**Main File**: `CareConnect-Pro.html`  
**Version**: v13.0.0 (Stability Release)  
**Last Updated**: November 27, 2025

