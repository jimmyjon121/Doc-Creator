# CareConnect Pro - Modular Development System

## 🎯 Overview

This project now has a **modular build system** that maintains the simplicity clinicians love while giving developers modern tools.

### What This Means:
- **For Clinicians**: Nothing changes! They still get one `CareConnect-Pro.html` file to double-click
- **For Developers**: You can now work with organized, modular code
- **Best of Both Worlds**: Single-file distribution with modular development

---

## 🚀 Quick Start for Developers

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Application
```bash
npm run build
# or use the simple builder:
node build-simple.js
```

### 3. Output
Your distributable file is in: `dist/CareConnect-Pro.html`

---

## 📁 Project Structure

```
Doc-Creator-1/
├── AppsCode-DeluxeCMS.html    # Original monolithic file (preserved)
├── dist/                       # Distribution folder
│   ├── CareConnect-Pro.html   # Single file for clinicians
│   ├── chrome-extension/       # Chrome extension
│   ├── README.txt             # Instructions for clinicians
│   ├── Start-CareConnect.bat  # Windows launcher
│   └── Start-CareConnect.sh   # Mac/Linux launcher
│
├── enhancements/              # Your custom code goes here!
│   ├── styles.css            # Custom CSS enhancements
│   ├── features.js           # New features
│   └── bugfixes.js           # Bug fixes
│
├── src/                       # Extracted modules (for reference)
│   ├── css/                  # Extracted stylesheets
│   ├── js/                   # Extracted JavaScript
│   └── data/                 # Configuration data
│
├── chrome-extension-enhanced/ # Chrome extension v11
│   └── [extension files]
│
├── build-simple.js           # Simple build script
├── build.js                  # Advanced build script
└── package.json              # NPM configuration
```

---

## 🛠️ Development Workflow

### Adding New Features

1. **Add your code to `enhancements/`**:
   ```javascript
   // enhancements/features.js
   function myNewFeature() {
       console.log('New feature activated!');
   }
   ```

2. **Run the build**:
   ```bash
   node build-simple.js
   ```

3. **Test locally**:
   Open `dist/CareConnect-Pro.html` in your browser

4. **Deploy to clinicians**:
   Give them the entire `dist/` folder

### Fixing Bugs

1. **Add fixes to `enhancements/bugfixes.js`**:
   ```javascript
   // Fix for specific issue
   if (document.querySelector('.problem-element')) {
       // Your fix here
   }
   ```

2. **Build and test**:
   ```bash
   npm run build
   ```

### Adding Custom Styles

1. **Edit `enhancements/styles.css`**:
   ```css
   /* Make buttons bigger for touchscreens */
   .btn-primary {
       min-height: 50px !important;
       font-size: 18px !important;
   }
   ```

2. **Build and deploy**

---

## 📦 Build Commands

```bash
# Simple build (recommended)
node build-simple.js

# Advanced build with extraction
npm run build

# Watch for changes
npm run watch

# Clean build artifacts
npm run clean

# Create distribution package
npm run package
```

---

## 🔧 How the Build System Works

### Simple Builder (`build-simple.js`)
1. Takes the original `AppsCode-DeluxeCMS.html`
2. Injects any enhancements from `enhancements/` folder
3. Updates version and build information
4. Outputs to `dist/CareConnect-Pro.html`
5. Includes Chrome extension and documentation

### Advanced Builder (`build.js`)
1. Extracts code into modules (one-time operation)
2. Allows true modular development
3. Compiles everything back into single file
4. More complex but more powerful

---

## 💡 Best Practices

### DO:
✅ Keep all custom code in `enhancements/` folder
✅ Test thoroughly before distribution
✅ Update version numbers in `package.json`
✅ Document your changes
✅ Use the simple builder for quick fixes

### DON'T:
❌ Edit the distributed HTML directly
❌ Modify `AppsCode-DeluxeCMS.html` (it's the source)
❌ Forget to test in different browsers
❌ Skip the build process

---

## 🚨 Important Notes

### Browser Storage Limits
- localStorage is limited to ~10MB
- The app uses encryption which adds overhead
- Monitor storage usage in Chrome DevTools

### Chrome Extension Issues
- Some sites block content scripts
- Chrome caches extensions aggressively
- Users may need to reload the extension after updates

### Security Considerations
- Credentials are hashed with SHA-256
- All data is encrypted with AES-256-GCM
- Everything stays local (HIPAA compliant)

---

## 🎯 Deployment to Clinicians

### What They Get:
```
dist/
├── CareConnect-Pro.html       # The app (double-click to open)
├── chrome-extension/           # Extension (optional)
├── README.txt                  # Simple instructions
├── Start-CareConnect.bat       # Windows users click this
└── Start-CareConnect.sh        # Mac/Linux users click this
```

### What They Do:
1. **Windows**: Double-click `Start-CareConnect.bat`
2. **Mac**: Double-click `Start-CareConnect.sh`
3. **Manual**: Open `CareConnect-Pro.html` in any browser

### Chrome Extension Installation:
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `chrome-extension` folder

---

## 🔄 Migration from Old System

If clinicians are using the old version:
1. Export their data (in the app: Settings → Export)
2. Give them the new `dist/` folder
3. Import their data (in the app: Settings → Import)
4. Done! All their programs and documents are preserved

---

## 📈 Future Improvements

### Planned Enhancements:
- [ ] React/Vue migration for better maintainability
- [ ] Automated testing suite
- [ ] Cloud backup option (optional, HIPAA compliant)
- [ ] Mobile app version
- [ ] Real-time collaboration features

### How to Contribute:
1. Add your enhancement to `enhancements/` folder
2. Test thoroughly
3. Update this README
4. Build and distribute

---

## 🆘 Troubleshooting

### Build Issues:
```bash
# Clear everything and rebuild
rm -rf dist/ node_modules/
npm install
node build-simple.js
```

### Chrome Extension Not Working:
1. Check Chrome version (must be 90+)
2. Reload the extension
3. Check for content script blocking

### Login Issues:
- Default: `Doc121` / `FFA121`
- Master: Check source code for master credentials
- Make sure CAPS LOCK is off

---

## 📞 Support

### For Developers:
- Check this README first
- Review the source code
- Test in Chrome DevTools

### For Clinicians:
- Use the simple README.txt in dist/
- Contact IT support
- Check the troubleshooting section

---

## 📄 License

PROPRIETARY - Family First Adolescent Services
This software is for internal use only.

---

*Last Updated: October 2024*
*Version: 4.0.0*
*Build System: Modular with Single-File Output*
