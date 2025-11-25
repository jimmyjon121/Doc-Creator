# CareConnect Pro - Changelog

## Version 12.1 (Stable) - November 25, 2025

### 🔧 Critical Bug Fixes

#### Client Profile System
- **Fixed `viewClientDetails` function shadowing** - Removed 1,300+ lines of duplicate legacy code that was preventing the modern Client Profile Manager from working
- **Simplified client profile delegation** - Local `viewClientDetails` now properly delegates to `window.clientProfileManager.open()` instead of rendering its own modal
- **Fixed redundant fallback** - Updated the global `window.viewClientDetails` fallback to also use the modern Client Profile Manager

#### Houses Manager Initialization
- **Fixed `ReferenceError: HousesManager is not defined`** - Added deferred initialization check in `initializeCMTracker()` to ensure `HousesManager` class is loaded before instantiation
- **Added retry mechanism** - If `HousesManager` is not yet defined, initialization retries after 500ms

#### UI/Layout Fixes
- **Fixed floating panels** - Added inline styles to `#historyPanel` and `#comparisonView` to ensure they are hidden by default
- **Panels now properly positioned** - Document History and Program Comparison panels no longer appear as floating elements on page load

#### Character Encoding
- **Fixed emoji encoding (mojibake)** - Restored file from backup to fix garbled emoji characters that were displaying incorrectly

### 📁 Files Changed
- `CareConnect-Pro.html` - Main application file with all fixes applied
- `CareConnect-Pro-BACKUP-BEFORE-CLEANUP.html` - Backup file added for safety

### ⚠️ Known Issues
- Some onboarding module files return 404 (files not present in this version)
- These do not affect core functionality

---

## Previous Versions

### Version 12.0
- Initial cleanup version
- Consolidated from multiple development branches

