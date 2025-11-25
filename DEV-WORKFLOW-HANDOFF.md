# 🚀 Daily Development Workflow - Quick Reference

**Last Updated:** Today's session  
**Branch:** `cleanup/v12`  
**Status:** ✅ All changes committed and pushed

---

## ⚡ Quick Start (Tomorrow Morning)

### 1. Start the Dev Server
```powershell
cd Doc-Creator-cleanup-v12\CURRENT-VERSION-v12\docs
node server.js
```

**Server runs on:** `http://localhost:8000`

### 2. Open the App
- **Main App:** `http://localhost:8000/CareConnect-Pro.html`
- **Root URL:** `http://localhost:8000/` (auto-redirects to main app)

---

## 📁 Where Everything Lives

### **Active Development Directory**
```
Doc-Creator-cleanup-v12/CURRENT-VERSION-v12/
```

**This is where you edit files!** The dev server serves from this directory.

### **Key Files You'll Edit**

| File | Purpose | Location |
|------|---------|----------|
| **Main App** | The single-file application | `CURRENT-VERSION-v12/CareConnect-Pro.html` |
| **Programs Data** | Program database JSON | `CURRENT-VERSION-v12/programs.v2.json` |
| **Programs Module** | Programs & Docs UI | `CURRENT-VERSION-v12/programs-docs-module.html` |
| **CSS Files** | Stylesheets | `CURRENT-VERSION-v12/css/*.css` |
| **JS Modules** | Core JavaScript | `CURRENT-VERSION-v12/js/**/*.js` |

### **Dev Server Script**
- **Location:** `CURRENT-VERSION-v12/docs/server.js`
- **Port:** `8000`
- **Serves from:** `CURRENT-VERSION-v12/` directory (the parent of `docs/`)

---

## 🔧 How the Dev Server Works

The server (`docs/server.js`) serves files from the **parent directory** (`CURRENT-VERSION-v12/`).

**File Resolution:**
- Request: `http://localhost:8000/CareConnect-Pro.html`
- Server looks for: `CURRENT-VERSION-v12/CareConnect-Pro.html`
- ✅ **This is why edits in `CURRENT-VERSION-v12/` show up immediately**

**Important:** The server uses `__dirname` which points to `docs/`, then serves files from the parent directory.

---

## 🎯 Development Workflow

### Making Changes

1. **Edit files in:** `CURRENT-VERSION-v12/`
2. **Save your changes**
3. **Refresh browser** (no rebuild needed - it's serving directly!)
4. **Test your changes**

### If Changes Don't Show Up

**Common Issues:**

1. **Wrong directory?**
   - ✅ Make sure you're editing files in `CURRENT-VERSION-v12/`
   - ❌ Don't edit files in `CHECKPOINTS/` or `releases/` (those are backups)

2. **Server not running?**
   - Check terminal for: `Server running at: http://localhost:8000`
   - If not running, start it: `node docs/server.js`

3. **Browser cache?**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or open DevTools → Network → Check "Disable cache"

4. **Wrong file?**
   - Main app is: `CareConnect-Pro.html` (not `CareConnect-Interactive.html` or others)
   - Check browser URL bar

---

## 🗺️ Map v2 (React Module)

**Separate project** in `map-v2/` directory.

### To Run Map Dev Server:
```powershell
cd Doc-Creator-cleanup-v12
npm run map:dev
```

This runs Vite dev server (usually on port 5173) for the React map component.

### To Build Map for Production:
```powershell
npm run map:build
```

Builds to: `CURRENT-VERSION-v12/map-v2-dist/`

---

## 🛠️ Build System (Legacy)

There's also a build system at the root level:

```powershell
cd Doc-Creator-cleanup-v12
npm run build
```

This runs `build-simple.js` and outputs to `dist/` folder.  
**Note:** For daily dev work, you typically don't need this - the dev server serves directly from `CURRENT-VERSION-v12/`.

---

## 🐛 Debugging Tools

All available at `http://localhost:8000/`:

| Tool | URL | Purpose |
|------|-----|---------|
| **Reset App** | `/test/reset-app.html` | Wipe all localStorage/sessionStorage |
| **Session Test** | `/test/test-session-persistence.html` | Test auth persistence |
| **Quick Test** | `/test/test-quick.html` | Lightweight session checks |

---

## 📝 Git Workflow

**Current Branch:** `cleanup/v12`

### To Commit Changes:
```powershell
cd Doc-Creator-cleanup-v12
git add -A
git commit -m "Your commit message"
git push origin cleanup/v12
```

### To Check Status:
```powershell
git status
```

---

## 🎨 File Structure Summary

```
Doc-Creator-cleanup-v12/
├── CURRENT-VERSION-v12/          ← 🎯 EDIT FILES HERE
│   ├── CareConnect-Pro.html      ← Main app (single-file)
│   ├── programs.v2.json          ← Program database
│   ├── programs-docs-module.html ← Programs UI module
│   ├── css/                      ← Stylesheets
│   ├── js/                       ← JavaScript modules
│   ├── docs/
│   │   └── server.js             ← Dev server (port 8000)
│   └── test/                     ← Debug tools
│
├── map-v2/                       ← React map (separate project)
│   └── (Vite dev server)
│
├── dist/                         ← Build output (legacy)
├── enhancements/                 ← Custom patches
└── CHECKPOINTS/                  ← Historical backups (read-only)
```

---

## ✅ Quick Checklist (Tomorrow)

- [ ] Navigate to `Doc-Creator-cleanup-v12/CURRENT-VERSION-v12/docs/`
- [ ] Run `node server.js`
- [ ] Open `http://localhost:8000/CareConnect-Pro.html`
- [ ] Verify the app loads correctly
- [ ] Make edits in `CURRENT-VERSION-v12/` directory
- [ ] Refresh browser to see changes

---

## 🆘 If Something's Broken

1. **Check the terminal** - Is the server running? Any errors?
2. **Check browser console** - F12 → Console tab
3. **Verify file paths** - Are you editing the right files?
4. **Try reset tool** - `http://localhost:8000/test/reset-app.html`
5. **Check git status** - `git status` to see what changed

---

**Remember:** The dev server serves directly from `CURRENT-VERSION-v12/`, so edits there show up immediately after a browser refresh. No build step needed for daily development!

