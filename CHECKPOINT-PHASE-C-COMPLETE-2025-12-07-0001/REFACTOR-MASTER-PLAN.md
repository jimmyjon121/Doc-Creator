# 🏗️ CareConnect Pro - Master Refactoring Plan
> **Goal:** Transform this codebase into a best-practices exemplar
> **Created:** December 6, 2025
> **Status:** PLANNING PHASE

---

## 📊 Current State Assessment

### What We Have (The Good)
| Component | Quality | Notes |
|-----------|---------|-------|
| `TaskSchema` | ⭐⭐⭐⭐⭐ | Well-documented, versioned, clean |
| `TaskService` | ⭐⭐⭐⭐⭐ | Clean architecture, good JSDoc |
| `IndexedDBManager` | ⭐⭐⭐⭐ | Solid persistence layer |
| `DateHelpers` | ⭐⭐⭐⭐ | Single utility, good practice |
| `js/programs/*` | ⭐⭐⭐⭐ | Modular, organized |
| `DashboardWidgets` | ⭐⭐⭐ | Good inheritance, needs extraction |

### What Needs Work (Technical Debt)
| Issue | Severity | Lines Affected |
|-------|----------|----------------|
| **Monolithic HTML** | 🔴 Critical | 31,700 lines |
| **Inline JS in HTML** | 🔴 Critical | ~5,000 lines |
| **Global namespace pollution** | 🟠 High | 30+ `window.*` |
| **Legacy systems** | 🟠 High | TrackerEngine, cm-tracker |
| **No build system** | 🟡 Medium | Manual script ordering |
| **Inconsistent patterns** | 🟡 Medium | IIFEs + classes + globals |
| **Hardcoded auth** | 🟡 Medium | Beta only |

---

## 🎯 Target Architecture

```
src/
├── index.html                    # Clean shell (~200 lines)
├── app.js                        # Entry point, bootstrapping
│
├── core/                         # Framework-level code
│   ├── Database.js               # IndexedDB wrapper
│   ├── EventBus.js               # Pub/sub messaging
│   ├── Router.js                 # Tab/view navigation
│   └── ServiceRegistry.js        # Dependency injection
│
├── config/                       # Configuration & schemas
│   ├── app.config.js             # Environment, feature flags
│   ├── task-schema.js            # ✅ Already good
│   └── houses.config.js          # House definitions
│
├── services/                     # Business logic layer
│   ├── AuthService.js            # Authentication
│   ├── ClientService.js          # Client CRUD (from ClientManager)
│   ├── TaskService.js            # ✅ Already good
│   ├── DashboardService.js       # Data aggregation
│   └── DocumentService.js        # PDF generation
│
├── models/                       # Data structures
│   ├── Client.js                 # Client model with validation
│   ├── Task.js                   # Task model
│   └── House.js                  # House model
│
├── ui/                           # Presentation layer
│   ├── components/               # Reusable UI pieces
│   │   ├── Card.js
│   │   ├── Modal.js
│   │   ├── Toast.js
│   │   └── DataTable.js
│   │
│   ├── views/                    # Full-page views
│   │   ├── DashboardView.js
│   │   ├── ClientsView.js
│   │   ├── ProgramsView.js
│   │   └── ProfileView.js
│   │
│   └── widgets/                  # Dashboard widgets
│       ├── Widget.js             # Base class
│       ├── FlightPlanWidget.js
│       ├── JourneyRadarWidget.js
│       ├── HouseHealthWidget.js
│       └── ...
│
├── utils/                        # Pure utility functions
│   ├── date-helpers.js           # ✅ Already exists
│   ├── format.js                 # String/number formatting
│   └── validation.js             # Input validation
│
├── styles/                       # CSS architecture
│   ├── tokens/                   # Design tokens
│   │   ├── colors.css
│   │   ├── typography.css
│   │   └── spacing.css
│   ├── base/                     # Reset, defaults
│   ├── components/               # Component styles
│   └── views/                    # View-specific styles
│
└── legacy/                       # Quarantined legacy code
    ├── tracker-engine.js         # DEPRECATED - remove in v14
    └── cm-tracker.js             # DEPRECATED - remove in v14
```

---

## 📋 Refactoring Phases

### Phase 1: Foundation (Week 1-2)
> **Goal:** Establish core architecture without breaking anything

#### 1.1 Create Core Module System
```javascript
// src/core/ServiceRegistry.js
export class ServiceRegistry {
    static #services = new Map();
    
    static register(name, instance) {
        this.#services.set(name, instance);
    }
    
    static get(name) {
        return this.#services.get(name);
    }
}
```

#### 1.2 Extract EventBus
- [ ] Create `src/core/EventBus.js`
- [ ] Replace direct function calls with events
- [ ] Document all event types

#### 1.3 Create App Shell
- [ ] Extract inline CSS to separate files
- [ ] Create clean `index.html` (~200 lines)
- [ ] Move inline JS to modules

**Deliverable:** Working app with modular entry point

---

### Phase 2: Service Layer (Week 2-3)
> **Goal:** Extract business logic into testable services

#### 2.1 ClientService (from ClientManager)
- [ ] Extract to `src/services/ClientService.js`
- [ ] Add TypeScript-style JSDoc annotations
- [ ] Create `src/models/Client.js` with validation
- [ ] Write unit tests

#### 2.2 DashboardService (from DashboardManager)
- [ ] Extract data aggregation logic
- [ ] Separate from UI rendering
- [ ] Add caching with clear invalidation

#### 2.3 AuthService
- [ ] Extract from `login-robust.js`
- [ ] Make credentials configurable
- [ ] Add environment-based config

**Deliverable:** Clean service layer with dependency injection

---

### Phase 3: UI Components (Week 3-4)
> **Goal:** Modular, reusable UI components

#### 3.1 Extract Base Components
- [ ] `Modal.js` - Reusable modal wrapper
- [ ] `Card.js` - Base card component
- [ ] `DataTable.js` - Sortable/filterable table
- [ ] `Toast.js` - Notification system

#### 3.2 Extract Dashboard Widgets
- [ ] Move 9 widget classes to `src/ui/widgets/`
- [ ] Ensure `Widget.js` base class is clean
- [ ] Document widget lifecycle

#### 3.3 Extract Views
- [ ] `DashboardView.js` - Dashboard tab
- [ ] `ClientsView.js` - Clients tab (replace cm-tracker)
- [ ] `ProgramsView.js` - Programs tab
- [ ] `ProfileView.js` - Client profile modal

**Deliverable:** Component library with documentation

---

### Phase 4: Build System (Week 4-5)
> **Goal:** Modern tooling without complexity

#### 4.1 Choose Build Tool
**Recommended:** Vite (already used for map-v2)
- Fast dev server
- ES modules native
- Simple config
- Good for offline-first apps

#### 4.2 Setup Structure
```
├── vite.config.js
├── package.json
├── src/
│   └── (new architecture)
├── public/
│   ├── libs/              # Vendor libraries
│   └── assets/            # Static assets
└── dist/                  # Build output
```

#### 4.3 Migration Strategy
- [ ] Set up Vite alongside existing code
- [ ] Gradually import modules
- [ ] Keep `<script>` fallback for legacy

**Deliverable:** Build pipeline with hot reload

---

### Phase 5: Legacy Removal (Week 5-6)
> **Goal:** Clean retirement of deprecated code

#### 5.1 TrackerEngine Sunset
- [ ] Ensure TaskService covers all use cases
- [ ] Update morning-review-dashboard.js
- [ ] Update tracker-bulk-update.js
- [ ] Remove TrackerEngine

#### 5.2 CM-Tracker Replacement
- [ ] Build new ClientsView component
- [ ] Ensure export functionality works
- [ ] Remove cm-tracker.js

#### 5.3 Inline Code Extraction
- [ ] Extract ComplianceWidget (line 3175)
- [ ] Extract DocumentHub (line 3562)
- [ ] Remove all `<script>` inline blocks

**Deliverable:** Zero legacy code, clean codebase

---

### Phase 6: Polish & Documentation (Week 6)
> **Goal:** Production-ready exemplar

#### 6.1 Documentation
- [ ] JSDoc for all public APIs
- [ ] Architecture diagram
- [ ] Developer onboarding guide
- [ ] API reference

#### 6.2 Code Quality
- [ ] ESLint configuration
- [ ] Prettier formatting
- [ ] Pre-commit hooks

#### 6.3 Testing
- [ ] Unit tests for services
- [ ] Integration tests for critical flows
- [ ] E2E smoke tests

**Deliverable:** Best-practices reference implementation

---

## 📐 Coding Standards

### Naming Conventions
```javascript
// Classes: PascalCase
class ClientService {}

// Methods/Functions: camelCase
function calculateDaysInCare() {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Private: #prefix (ES2022)
class Example {
    #privateField = 'hidden';
}

// Files: kebab-case.js
// client-service.js, date-helpers.js
```

### JSDoc Standard
```javascript
/**
 * Calculate the number of days a client has been in care.
 * 
 * @param {Date} admissionDate - The client's admission date
 * @param {Date} [endDate=new Date()] - Optional end date (defaults to today)
 * @returns {number} Days in care (partial days count as 1)
 * @throws {Error} If admissionDate is in the future
 * 
 * @example
 * const days = calculateDaysInCare(new Date('2025-01-01'));
 * // Returns: 340 (as of Dec 6, 2025)
 */
function calculateDaysInCare(admissionDate, endDate = new Date()) {
    // ...
}
```

### File Structure
```javascript
/**
 * @fileoverview Brief description of what this module does
 * @module services/ClientService
 */

// 1. Imports (external first, then internal)
import { EventBus } from '../core/EventBus.js';
import { DateHelpers } from '../utils/date-helpers.js';

// 2. Constants
const CACHE_DURATION = 60000;

// 3. Main class/function
export class ClientService {
    // ...
}

// 4. Helper functions (private)
function normalizeClientData(data) {
    // ...
}
```

---

## 🚀 Quick Wins (Can Do Now)

These require no architectural changes:

1. **Extract ComplianceWidget** from CareConnect-Pro.html → `ui/widgets/ComplianceWidget.js`
2. **Extract DocumentHub** from CareConnect-Pro.html → `ui/components/DocumentHub.js`
3. **Add JSDoc headers** to all existing classes
4. **Create `src/models/Client.js`** with Zod-like validation
5. **Consolidate CSS** - merge duplicate selectors

---

## 📊 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| HTML file size | 31,700 lines | <300 lines |
| Inline JS | ~5,000 lines | 0 lines |
| Global variables | 30+ | <5 |
| Test coverage | 0% | >70% |
| JSDoc coverage | ~30% | 100% |
| Build time | N/A | <5 seconds |

---

## ⚠️ Risk Mitigation

### Don't Break Production
- Work exclusively in `REFACTOR-EXPERIMENTAL/`
- Keep `CURRENT-VERSION-v12/` untouched
- Test each phase before proceeding

### Preserve Functionality
- Document all behaviors before refactoring
- Create integration tests first
- Use feature flags for gradual rollout

### Handle Dependencies
- Map all `window.*` references
- Track script load order
- Test offline functionality

---

## 🗓️ Timeline Summary

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| 1. Foundation | Week 1-2 | Core module system |
| 2. Services | Week 2-3 | Testable business logic |
| 3. UI | Week 3-4 | Component library |
| 4. Build | Week 4-5 | Vite pipeline |
| 5. Legacy | Week 5-6 | Zero deprecated code |
| 6. Polish | Week 6 | Documentation & tests |

**Total Estimated Time:** 6 weeks (can be compressed to 4 with focused effort)

---

## ✅ Ready to Start?

**Recommended First Steps:**
1. Review this plan - adjust priorities if needed
2. Start Phase 1.1 - Create ServiceRegistry
3. Extract one component as proof-of-concept

**Questions to Discuss:**
- Do you want TypeScript, or stay with JSDoc-typed JavaScript?
- Priority: Speed of delivery vs. test coverage?
- Any features frozen during refactor, or keep developing?

---

*This document is the single source of truth for the refactoring effort.*
*Update as decisions are made.*

