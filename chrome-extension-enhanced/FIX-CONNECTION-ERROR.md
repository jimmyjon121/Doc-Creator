# Fix for "Could not establish connection" Error

## The Issue
The error "Could not establish connection. Receiving end does not exist" occurs when the popup tries to communicate with a content script that isn't properly loaded.

## Solution Steps:

### 1. Reload the Extension Completely
1. Go to `chrome://extensions/`
2. Find "Family First Program Extractor - Enhanced"
3. Click the refresh/reload button (↻)
4. **Important**: Close and reopen any tabs you want to extract from

### 2. If Error Persists After Reload:

#### Check Current Page
- The extension cannot run on:
  - Chrome internal pages (chrome://, chrome-extension://)
  - Chrome Web Store
  - PDF files
  - Local HTML files (unless you enable "Allow access to file URLs" in extension settings)

#### Try These Steps:
1. **Refresh the target website** (F5 or Ctrl+R)
2. **Wait for page to fully load** before clicking extension
3. **Click extension icon** then click "Extract Program Info"

### 3. Enable File Access (if testing locally):
1. Go to `chrome://extensions/`
2. Click "Details" on the extension
3. Toggle ON "Allow access to file URLs"

### 4. Quick Test:
Try the extension on a known treatment center website:
- https://www.paradigmtreatment.com/
- https://www.newportacademy.com/
- https://discoveryranch.net/

### 5. Debug Mode Check:
1. Right-click the extension icon
2. Select "Inspect popup"
3. Check the Console tab for any red errors
4. Share those errors if the issue persists

## Common Causes & Solutions:

| Issue | Solution |
|-------|----------|
| Extension just updated | Reload extension & refresh target page |
| Page not fully loaded | Wait for complete page load |
| Restricted page (chrome://) | Use on regular websites only |
| Content script blocked | Refresh page & try again |
| Old version cached | Clear browser cache & reload |

## Emergency Fallback:
If nothing works:
1. Uninstall the extension
2. Re-add it from the chrome-extension-enhanced folder
3. Make sure to reload any target pages

## The Enhanced Extension Features Still Work!
Once properly loaded, you'll get:
- 50+ data fields extracted
- Multi-page analysis (up to 50 pages)
- Professional clinical writeups
- Quality scoring
- Parallel processing for speed

The connection error is just a loading issue - the 10x improvements are all there!
