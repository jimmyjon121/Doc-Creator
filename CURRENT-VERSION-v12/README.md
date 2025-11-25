# CareConnect Pro - Development Workspace

**Current Version:** v12.2 (Dev)

This directory (`CURRENT-VERSION-v12/`) is the active development workspace for CareConnect Pro.

> 📖 **Quick Start Guide:** See [`../DEV-WORKFLOW-HANDOFF.md`](../DEV-WORKFLOW-HANDOFF.md) for detailed daily workflow instructions, troubleshooting, and file locations.

## 🛠️ Development Workflow

We follow a strict **R&D vs. Stable** workflow to ensure stability while allowing rapid iteration.

### 1. Active Development (R&D)
- **File:** `CareConnect-Pro.html`
- **Purpose:** This is the "working copy". All debugging, fixes, and new feature integration happen here first.
- **Status:** Always the latest commit on the `cleanup/v12` branch.
- **How to Run:**
  - Run `Start-Server.bat` (Windows) or `node server.js`
  - Open `http://localhost:8000/CareConnect-Pro.html`

### 2. Stable Releases
- **Location:** `releases/` folder.
- **Naming:** `CareConnect-Pro_v12.X-STABLE.html`
- **Purpose:** These are frozen, tested snapshots ready for distribution to clinicians.
- **How to Create:**
  1. Verify `CareConnect-Pro.html` is stable and bug-free.
  2. Copy it to `releases/` with the next version number.
  3. Commit and tag the release.

## 📂 Directory Structure

- **`CareConnect-Pro.html`**: The main application file (Dev).
- **`releases/`**: Stable, versioned snapshots.
- **`archive/`**: Legacy variants and retired code.
- **`js/`**: Core JavaScript modules (auth, persistence, programs).
- **`tools/`**: Development helpers (servers, importers).
- **`programs-docs-module.html`**: The injected Programs & Docs module.

## 🔐 Login Credentials (Dev)

- **Master Admin:** `MasterAdmin` / `FFA@dm1n2025!`
- **Doc Admin:** `Doc121` / `FFA121`

## 🐛 Debugging

- **Reset App:** `http://localhost:8000/reset-app.html` (Wipes all local data)
- **Session Test:** `http://localhost:8000/test-session-persistence.html`
- **Debug Mode:** Add `?debug=1` to the URL to enable verbose logging.

