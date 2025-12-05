# Dark Bar Issue in Light Mode - Investigation & Attempts

## Problem Description

In **light mode**, a dark purple/gray bar appears around the main content area in:
- Dashboard tab
- Programs & Docs tab  
- Clients tab

The dark bar is the body background color showing through the gaps/margins of the "floating card" layout design.

## Visual Description

The app uses a "floating card" design where:
- The main content area (`.container`) has:
  - `margin: calc(var(--app-shell-total-header, 128px) + 20px) auto 60px;`
  - `border-radius: 28px;`
  - `box-shadow: 0 25px 60px rgba(102, 126, 234, 0.25);`
  - `background: white;`
- This creates a card that "floats" on top of the body background
- In dark mode, the body is dark → looks correct
- In light mode, the body SHOULD be `#F8F7FC` but appears dark

## Root Cause Analysis

### Expected Behavior
- `theme-tokens.css` line 17 defines: `--bg-base: #F8F7FC;` (light lavender)
- `theme-tokens.css` lines 480-486 set: `html, body { background-color: var(--bg-base); }`
- This should make the body light in light mode

### Actual Behavior
- Body background appears dark purple/gray in light mode
- The `--bg-base` variable is correctly defined
- Multiple CSS rules attempt to set the light background
- Something is overriding these rules

## Files Involved

| File | Role |
|------|------|
| `css/theme-tokens.css` | Defines `--bg-base` and applies to html/body |
| `css/app-layout.css` | Layout rules, dark mode overrides |
| `css/dark-mode.css` | ~1600 lines of `!important` dark mode overrides |
| `CareConnect-Pro.html` | Inline styles, JavaScript that manipulates backgrounds |

## Attempted Fixes (All Reverted to Preserve Structure)

### Attempt 1: CSS `!important` overrides
```css
html:not([data-theme="dark"]),
body:not(.dark-mode) {
    background: #F8F7FC !important;
}
```
**Result:** Did not work - something has higher specificity or is setting inline styles

### Attempt 2: Remove top padding from containers
```css
body.programs-docs-v2-active .container {
    padding: 0 clamp(16px, 2.5vw, 56px) !important; /* removed top padding */
}
```
**Result:** Changed structure/layout - REVERTED

### Attempt 3: Remove border-radius from containers
```css
.container {
    border-radius: 0 !important;
}
```
**Result:** Changed structure/layout - REVERTED

### Attempt 4: Inline styles on HTML elements
```html
<body style="background: #F8F7FC !important;">
<div class="container" style="background: #F8F7FC; border-radius: 0;">
```
**Result:** CSS `!important` cannot be used in inline styles; still overridden

### Attempt 5: JavaScript to force backgrounds
```javascript
document.body.style.background = '#F8F7FC';
document.documentElement.style.background = '#F8F7FC';
```
**Result:** Gets overridden by other JavaScript or CSS

### Attempt 6: CSS at end of file (highest cascade priority)
Added `<style>` block right before `</body>` tag
**Result:** Still not working

## Key Findings

### JavaScript Background Manipulation
Found in `CareConnect-Pro.html`:

1. **Line 1554** - Dashboard theme:
   ```javascript
   document.body.style.background = '#F8F7FC';
   ```

2. **Lines 15920-15923** - Programs module mount:
   ```javascript
   document.documentElement.style.background = lightBg;
   document.body.style.background = lightBg;
   ```

3. **Lines 27018-27024** - Tab switch:
   ```javascript
   if (document.body.classList.contains('programs-docs-v2-active')) {
       document.body.style.background = ''; // CLEARS the background
   } else {
       document.body.style.background = 'var(--bg-base)';
   }
   ```

### CSS Load Order
1. `css/theme-tokens.css` (loaded first)
2. `css/client-profile.css`
3. `css/programs-explorer.css`
4. `css/app-layout.css`
5. Inline `<style>` blocks in HTML (many)

### Dark Mode Classes/Attributes
The app uses multiple methods to detect dark mode:
- `html[data-theme="dark"]`
- `html.dark`
- `body.dark-mode`

## Theories for Root Cause

1. **JavaScript clearing styles:** Line 27019 sets `document.body.style.background = ''` which clears the inline style, expecting CSS to take over. But CSS may not be setting the correct value.

2. **CSS variable not resolving:** The `var(--bg-base)` might not be resolving correctly in the context where it's used.

3. **Specificity war:** With ~1600 lines of `!important` in `dark-mode.css`, there may be unintended specificity conflicts.

4. **Pseudo-element overlay:** There may be a `::before` or `::after` pseudo-element creating an overlay (though search found none active).

## Recommended Next Steps

1. **Browser DevTools inspection:**
   - Open DevTools → Elements → select `<body>`
   - Check Computed styles for `background` and `background-color`
   - See which CSS rule is winning
   - Check if there's an inline style being set

2. **Console debug:**
   ```javascript
   console.log('body background:', getComputedStyle(document.body).background);
   console.log('body inline style:', document.body.style.background);
   console.log('--bg-base value:', getComputedStyle(document.documentElement).getPropertyValue('--bg-base'));
   ```

3. **Clean fix approach:**
   - Instead of fighting specificity, find WHERE the dark background is being set
   - Fix it at the source rather than overriding

4. **Consider design change:**
   - If the floating card design is problematic, consider making the body always match the card background
   - Remove the floating card effect entirely (edge-to-edge layout)

## Files Changed During Investigation

All changes have been **reverted** to preserve original structure. The only remaining change is this documentation file.

## Related Tickets/Issues

- Original cleanup phase: v13 branch
- Beta testing preparation
- User reported: "black bar" around Dashboard, Programs, Clients tabs

---

*Document created: December 5, 2025*
*Status: UNRESOLVED - needs further investigation with browser DevTools*

