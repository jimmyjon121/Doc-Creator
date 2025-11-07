# CareConnect Pro - Troubleshooting Guide

## Quick Fixes for Common Issues

### 1. Login Screen Not Showing / Stuck on Loading

**Clear Browser Data:**
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Click "Clear site data" or manually clear:
   - Local Storage
   - Session Storage
   - IndexedDB
4. Refresh the page (Ctrl+F5)

### 2. Programs Not Loading / Dashboard Empty

**Force Refresh:**
1. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. If still not working, clear browser data (see above)
3. Close all browser tabs with the app
4. Open fresh in new tab

### 3. JavaScript Errors in Console

**Common Errors and Fixes:**

- **"lastActivity already declared"**: Clear cache and reload
- **"initializeEnhancedFeatures not defined"**: Fixed in latest build
- **"Service Worker registration failed"**: Normal for file:// protocol, ignore

### 4. Can't Login

**Check These:**
1. CAPS LOCK is off
2. No extra spaces in username/password
3. Try these credentials:
   - Master: `MasterAdmin` / `FFA@dm1n2025!`
   - Legacy: `Doc121` / `FFA121`

### 5. Coach Profile Not Saving

**Browser Requirements:**
- Must allow localStorage
- Not in Private/Incognito mode
- Cookies enabled for file:// URLs

### 6. Complete Reset

If nothing else works:

1. **Clear Everything:**
   ```
   - Close all browser tabs
   - Clear browser cache/data
   - Delete and re-copy CareConnect-Pro.html
   ```

2. **Fresh Start:**
   - Open CareConnect-Pro.html in new browser window
   - Create new account
   - Complete coach profile setup

### 7. Browser Compatibility

**Recommended Browsers:**
- Chrome (preferred)
- Edge
- Firefox

**Not Recommended:**
- Internet Explorer
- Safari (limited localStorage in some versions)

### 8. Development Tips

**For Developers:**
- Check browser console (F12) for detailed errors
- Look for enhancement files in `enhancements/` folder
- Remove specific enhancement files to disable features
- Master credentials bypass all restrictions

---

**Still Having Issues?**
1. Take screenshot of console errors (F12)
2. Note exact steps to reproduce
3. Check COACH-SYSTEM-GUIDE.md for setup instructions
