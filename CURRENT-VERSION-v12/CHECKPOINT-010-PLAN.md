# Checkpoint 010: Fix Legacy Button Gradient

## Issue Found
The Map button (and other view toggle buttons) use legacy purple gradient:
```css
background: linear-gradient(135deg, rgba(110, 123, 255, 0.22), rgba(110, 123, 255, 0.05));
```

## Proposed Fix
Replace with modern, clean styling:
```css
background: #e2e8f0; /* Clean gray */
```

## Risk Assessment
- **Risk Level:** Medium
- **Visual Impact:** Map button will look cleaner, less "legacy"
- **Functionality Impact:** None - just visual styling

## Files to Change
- `programs-docs-module.html` line 831

## Testing Required
1. Open Programs & Docs
2. Check view toggle buttons (Grid, Rows, Compare, Map)
3. Click Map button - should look modern
4. Verify all buttons still work
5. No visual regressions

## Rollback Plan
If anything breaks:
```
xcopy CHECKPOINTS\checkpoint-009-globals-cleaned\* CURRENT-VERSION-v12\ /E /Y
```
