# CareConnect Pro - Architecture Blueprint

## Overview
CareConnect Pro is a comprehensive care management application for tracking clients, houses, staff, and documentation in care facilities.

---

## Core Architecture

### Main Application File
- **`CareConnect-Pro.html`** - Single-page application (~27,000 lines)
  - Contains all HTML structure, inline CSS, and core JavaScript
  - Uses modular script loading for specialized features

### Database Layer
- **IndexedDB** via `db-manager.js`
  - Primary client-side data persistence
  - Stores clients, houses, staff, documents, and settings

### Authentication
- **`js/auth/login-robust.js`** - Authentication system
  - Handles user login/logout
  - Role-based access control (admin, staff, viewer)

---

## Key Modules

### Client Management
| File | Purpose |
|------|---------|
| `client-profile-manager.js` | Modern client profile viewer/editor |
| `client-manager.js` | Client CRUD operations |

**Important**: `window.clientProfileManager` is the authoritative client profile handler. All `viewClientDetails()` calls should delegate to this module.

### House Management
| File | Purpose |
|------|---------|
| `houses-manager.js` | Defines `HousesManager` class |
| `house-modal.js` | House detail modal |

**Note**: `HousesManager` must be loaded before `initializeCMTracker()` runs. Deferred initialization is implemented.

### Document Management
| File | Purpose |
|------|---------|
| `document-manager.js` | Document CRUD operations |
| `document-generator.js` | PDF/document generation |

### CM Tracker (Case Management)
| File | Purpose |
|------|---------|
| `cm-tracker.js` | Case management tracking |
| `cm-tracker-modals.js` | CM-related modals |

---

## UI Components

### Panels (Hidden by Default)
- **`#historyPanel`** - Document history sidebar (slides in from right)
- **`#comparisonView`** - Program comparison modal (centered overlay)

### Modals
- Client profile modal (managed by `ClientProfileManager`)
- House detail modal
- Document preview modal
- Various form modals

---

## Script Loading Order

```
1. Core utilities (db-manager.js, utils.js)
2. Authentication (login-robust.js)
3. Manager classes (houses-manager.js, client-manager.js)
4. UI modules (client-profile-manager.js, modals)
5. Feature modules (cm-tracker.js, document modules)
```

**Critical**: Manager classes must be fully loaded before instantiation in `initializeCMTracker()`.

---

## Global Objects

| Object | Purpose |
|--------|---------|
| `window.dbManager` | Database operations |
| `window.housesManager` | House management |
| `window.clientProfileManager` | Client profile UI |
| `window.viewClientDetails` | Function to open client profile |

---

## Data Flow

```
User Action → UI Event Handler → Manager Class → IndexedDB → UI Update
```

### Example: View Client Profile
```
1. User clicks client name
2. viewClientDetails(clientId) called
3. Delegates to window.clientProfileManager.open(clientId)
4. ClientProfileManager fetches from IndexedDB
5. Profile modal rendered
```

---

## Styling

### CSS Variables (Theme)
- Primary colors defined in `:root`
- Dark mode support
- Responsive breakpoints

### Key CSS Classes
- `.panel` - Sidebar panels
- `.modal` - Modal overlays
- `.card` - Card components
- `.btn-*` - Button variants

---

## Version 12.1 Fixes Applied

1. ✅ Removed duplicate `viewClientDetails` function (was 1,300+ lines)
2. ✅ Added deferred `HousesManager` initialization
3. ✅ Fixed hidden panel inline styles
4. ✅ Fixed character encoding for emojis

---

## Development Notes

### Adding New Features
1. Create module in `js/` directory
2. Add script tag to `CareConnect-Pro.html`
3. Register global object if needed
4. Follow existing patterns for IndexedDB operations

### Debugging Tips
- Check console for script loading order issues
- Verify `window.` objects are defined before use
- Use deferred initialization pattern for dependencies

---

## File Structure

```
CURRENT-VERSION-v12/
├── CareConnect-Pro.html          # Main application
├── CareConnect-Pro-BACKUP-*.html # Backups
├── CHANGELOG.md                  # Version history
├── BLUEPRINT.md                  # This file
├── js/
│   ├── auth/
│   │   └── login-robust.js
│   ├── client-profile-manager.js
│   ├── houses-manager.js
│   ├── db-manager.js
│   └── ... (other modules)
├── css/
│   └── ... (stylesheets)
└── assets/
    └── ... (images, icons)
```

