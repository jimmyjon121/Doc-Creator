# CareConnect Pro - Code Cleanup Scan Plan
## Date: November 20, 2025

## Objective
Systematically identify and document all legacy, broken, and duplicate code for removal to ensure a clean, maintainable codebase.

## Scan Phases

### Phase 1: Duplicate/Competing Loading Mechanisms
**Target:** Multiple systems trying to load the same data
- [ ] Programs data loaders (found 3+ different mechanisms)
- [ ] Client data loaders
- [ ] Dashboard data initialization
- [ ] Settings/preferences loading
- [ ] Module mounting/injection patterns

### Phase 2: Broken/Unused Functions
**Target:** Dead code that's never called
- [ ] Orphaned event handlers
- [ ] Unused utility functions
- [ ] Deprecated API calls
- [ ] Broken references to removed elements
- [ ] Console errors and warnings

### Phase 3: Legacy Authentication Code
**Target:** Old login systems still embedded
- [ ] Multiple login handlers
- [ ] Session storage vs localStorage conflicts
- [ ] Duplicate credential checks
- [ ] Old user management code
- [ ] Legacy encryption/hashing functions

### Phase 4: Redundant Data Storage
**Target:** Multiple places storing same data
- [ ] localStorage keys overlap
- [ ] sessionStorage remnants
- [ ] IndexedDB duplicate stores
- [ ] Global window variables duplication
- [ ] Cache mechanisms competing

### Phase 5: Conflicting UI/Styles
**Target:** Multiple systems trying to control UI
- [ ] Style injection functions
- [ ] Theme management duplicates
- [ ] Dashboard layout controllers
- [ ] Modal/dialog handlers
- [ ] Navigation state managers

### Phase 6: Module Independence Issues
**Target:** Modules that should be independent but aren't
- [ ] programs-docs-module.html dependencies
- [ ] Cross-module global variable pollution
- [ ] Shared state that shouldn't be shared
- [ ] Event bus conflicts

## Scan Methodology

### 1. Pattern Search
```
- handleLogin, login, authenticate, session
- loadPrograms, programsData, PROGRAMS
- dashboard, initDashboard, refreshDashboard
- localStorage.setItem, sessionStorage
- document.style, innerHTML, appendChild
- window.*, global variables
```

### 2. File Analysis Priority
1. CareConnect-Pro.html (main shell - 43K+ lines!)
2. programs-docs-module.html (7K+ lines)
3. All .js files in root
4. All .js files in js/ folder
5. Test files and utilities

### 3. Detection Criteria
- **Duplicate:** Same functionality in 2+ places
- **Legacy:** Old patterns, deprecated methods
- **Broken:** References non-existent elements/functions
- **Unused:** No calls found in codebase
- **Conflicting:** Multiple handlers for same event

## Expected Findings

### Known Issues Already Found
1. ✅ LEGACY_PROGRAMS_FALLBACK in programs-docs-module
2. ✅ Multiple login handlers
3. ✅ sessionStorage vs localStorage confusion
4. ✅ Purple gradient style injection

### Suspected Issues
1. Multiple dashboard initialization functions
2. Duplicate client manager instances
3. Competing theme/style managers
4. Old demo data generators referenced
5. Legacy navigation/tab systems
6. Duplicate PDF generation code
7. Multiple error handling systems

## Cleanup Strategy

### Priority Levels
- **P0 (Critical):** Actively breaking functionality
- **P1 (High):** Causing confusion/bugs
- **P2 (Medium):** Redundant but not harmful
- **P3 (Low):** Code smell but working

### Removal Process
1. Document what it does
2. Find all references
3. Identify replacement (if needed)
4. Test removal impact
5. Remove with git commit
6. Verify no breaks

### Safety Measures
- Git commit after each removal
- Test key workflows after each phase
- Keep removal log
- Document any behavior changes

## Success Criteria
- [ ] No duplicate data loaders
- [ ] Single source of truth for each feature
- [ ] No console errors/warnings
- [ ] Clean module boundaries
- [ ] Consistent data flow
- [ ] No legacy code remnants

## Next Steps
1. Begin Phase 1 scanning
2. Document findings in CLEANUP-FINDINGS.md
3. Create prioritized removal list
4. Execute removals with testing
5. Final validation
