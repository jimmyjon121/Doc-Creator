## CareConnect Dev Utilities

The following pages exist solely to help troubleshoot local builds.  
They refuse to run unless the app is loaded from `localhost` / `127.0.0.1`
or via the `file://` protocol.

| Tool | Path | Purpose | Notes |
| --- | --- | --- | --- |
| Reset App | `reset-app.html` | Wipe `localStorage`, `sessionStorage`, and cookies, then reload `CareConnect-Pro.html`. | Use when the UI is stuck due to corrupted data. |
| Quick Session Test | `test-quick.html` | Lightweight page to toggle session flags and verify refresh persistence. | Useful for sanity checks while implementing auth logic. |
| Session Persistence Harness | `test-session-persistence.html` | Full regression harness that exercises login, refresh counter, and TTL display. | Mirrors the legacy persistence tester from earlier builds. |
| Logout Fix Helper | `fix-logout-issue.html` | Deep-dive console to inspect storage, active session, and quickly clear conflicting keys. | Designed to reproduce/diagnose logout loops. |

### Usage

1. Start the local dev server (e.g. `Start-Server.bat` or `node server.js`).
2. Navigate to one of the pages above (e.g. `http://localhost:8000/reset-app.html`).
3. Follow the instructions on screen. Each page shows a warning if it detects a production hostname.

> **Reminder:** These tools are not bundled into production artifacts.
> They exist only in `CURRENT-VERSION-v12` for developer convenience.

