# ⚙️ CONFIGURATION INSTRUCTIONS

## 🎯 Quick Setup - Update Your Doc Creator Path

### Step 1: Find Your Doc Creator HTML File Path

**On Windows:**
1. Navigate to your Doc Creator HTML file in File Explorer
2. Right-click the file and select "Properties"
3. Copy the full path (e.g., `C:\Users\YourName\Documents\doc-creator.html`)
4. Convert to file URL: `file:///C:/Users/YourName/Documents/doc-creator.html`

**On Mac:**
1. Navigate to your Doc Creator HTML file in Finder
2. Right-click and select "Get Info"
3. Copy the path next to "Where:"
4. Convert to file URL: `file:///Users/YourName/Documents/doc-creator.html`

**On Linux:**
1. Navigate to your Doc Creator HTML file
2. Right-click and select "Properties"
3. Copy the full path
4. Convert to file URL: `file:///home/username/documents/doc-creator.html`

### Step 2: Update popup.js

Open `chrome-extension/popup.js` and find line 12:

```javascript
const DOC_CREATOR_URL = 'file:///path/to/your/doc-creator.html'; // UPDATE THIS!
```

Replace with your actual path:

```javascript
// Example for Windows:
const DOC_CREATOR_URL = 'file:///C:/Users/JohnDoe/Desktop/FamilyFirst/doc-creator.html';

// Example for Mac:
const DOC_CREATOR_URL = 'file:///Users/johndoe/Desktop/FamilyFirst/doc-creator.html';

// Example for hosted version (if you decide to host it later):
const DOC_CREATOR_URL = 'https://familyfirst.com/tools/doc-creator.html';
```

### Step 3: Repackage for Chrome Web Store

After updating the path, run:

```bash
bash package-for-store.sh
```

This creates a new `family-first-program-extractor-v1.0.0.zip` ready for upload.

---

## 🔐 Security Note for Local Files

Chrome has restrictions on extensions opening local files. To ensure it works:

1. **During Development:** The extension can open local files when loaded unpacked
2. **From Chrome Web Store:** Users may need to enable "Allow access to file URLs" for the extension:
   - Go to chrome://extensions/
   - Find "Family First Program Extractor"
   - Click "Details"
   - Toggle "Allow access to file URLs"

---

## 🌐 Alternative: Host Your Doc Creator

Instead of using a local file, consider hosting your Doc Creator:

### Option 1: GitHub Pages (Free)
1. Upload your HTML file to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Your URL will be: `https://[username].github.io/[repository]/doc-creator.html`

### Option 2: Simple Python Server
```python
# Save as server.py in your Doc Creator folder
import http.server
import socketserver

PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    httpd.serve_forever()
```

Then use: `const DOC_CREATOR_URL = 'http://localhost:8000/doc-creator.html';`

### Option 3: Local Web Server
- XAMPP (Windows)
- MAMP (Mac)
- Simple HTTP Server extensions for VS Code

---

## 📝 Testing Your Configuration

1. Load the extension in Chrome (unpacked)
2. Go to any treatment center website
3. Click the extension icon
4. Click "Open Doc Creator"
5. Verify it opens your Doc Creator tool

If it doesn't work:
- Check the path is correct
- Ensure "Allow access to file URLs" is enabled
- Check Chrome DevTools console for errors

---

## 🚀 Multiple Environments

You can support multiple environments:

```javascript
// In popup.js
const ENVIRONMENTS = {
    local: 'file:///C:/Users/YourName/Documents/doc-creator.html',
    development: 'http://localhost:8000/doc-creator.html',
    production: 'https://familyfirst.com/tools/doc-creator.html'
};

// Choose environment (change this for different builds)
const CURRENT_ENV = 'local';
const DOC_CREATOR_URL = ENVIRONMENTS[CURRENT_ENV];
```

---

## ❓ FAQ

**Q: Can users change the path after installation?**
A: Not directly, but you could add an options page to let users configure it.

**Q: What if team members have different file paths?**
A: Consider hosting the Doc Creator online or using a shared network drive.

**Q: Can we bundle the Doc Creator with the extension?**
A: Yes, but it's better to keep them separate for easier updates.

**Q: What about security?**
A: Local files are secure - only the user's browser can access them.

---

## 📧 Need Help?

If you're having trouble with configuration:
1. Check the browser console for errors (F12 → Console)
2. Verify file paths are correct
3. Ensure file permissions allow browser access
4. Contact: support@familyfirstas.com

Remember to update the path before submitting to Chrome Web Store!