# Legacy Code Scan - Phase 2
## Date: November 20, 2025

## Issue Identified
User found legacy map icon still visible, indicating we missed legacy code. Need comprehensive scan for ALL remaining legacy elements.

## Scan Strategy - Visual Artifacts as Clues

### Known Legacy Markers
1. ✅ Purple gradient (removed)
2. 🔍 Legacy map icon (found by user)
3. 🔍 Other visual artifacts?

### What to Scan For

#### Visual Elements
- Old icons, buttons, styles
- Outdated UI components  
- Legacy color schemes
- Old fonts or typography
- Deprecated visual patterns

#### Code Patterns
- Old function names
- Legacy event handlers
- Deprecated libraries
- Old CSS classes
- Unused HTML elements

#### Data/Loading Issues  
- Old API calls
- Legacy data structures
- Deprecated endpoints
- Old configuration

## Scan Plan - SLOW & CAREFUL

### Phase A: Visual Element Scan
1. Search for map-related icons/CSS
2. Find old UI component references
3. Look for deprecated visual patterns

### Phase B: Code Pattern Scan  
1. Search for "legacy", "old", "deprecated" comments
2. Find unused functions
3. Locate old event handlers

### Phase C: Dependency Scan
1. Check for old libraries
2. Find deprecated imports
3. Locate unused assets

## Safety Protocol
- One small change at a time
- Visual verification after each
- Checkpoint backup before changes
- Document what each piece does before removing
