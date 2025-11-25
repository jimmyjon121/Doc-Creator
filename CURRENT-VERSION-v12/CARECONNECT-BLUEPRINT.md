# CareConnect Pro – Product Blueprint & Onboarding Guide
_Last updated: 2025-11-25_

## 1. Purpose Of This Document
- Provide a single "source of truth" for engineers, designers, and operators onboarding to CareConnect Pro v13.
- Summarize product intent, current architecture, navigation model, data flows, and operational practices.
- Link key assets in the repository so new contributors know where to look first.

## 2. Product Snapshot
- **Product name:** CareConnect Pro (Family First Adolescent Services)
- **Current build:** v13.0.0 (CareConnect Pro v13 - Stability Release) – `CURRENT-VERSION-v12/CareConnect-Pro.html`
- **Stable snapshot:** `CURRENT-VERSION-v12/CareConnect-Pro-BACKUP-BEFORE-CLEANUP.html` (read-only reference)
- **Programs workspace:** `CURRENT-VERSION-v12/programs-docs-module.html`
- **Dataset:** `CURRENT-VERSION-v12/programs.v2.json` (140-program library)
- **Launch entry point (dev):** `http://localhost:8000/CareConnect-Pro.html`
- **Chrome extension:** `chrome-extension-enhanced/` (outside this bundle, but part of ecosystem)
- **Changelog:** See `CHANGELOG-v13.md` for detailed version history

## 3. Mission & Outcomes
- **Mission statement:** Ensure every adolescent receives timely, comprehensive aftercare planning while freeing clinical coaches to focus on direct care.
- **Primary outcomes:** 30–45 minute research cycles reduced to ~30 seconds; 95% accuracy on 60+ extracted program fields; milestone compliance 95%+.
- **Personas served:** Clinical coaches, supervisors/administrators, and families receiving discharge packets.

## 4. Platform Architecture Overview
- **Deployed form:** Offline-capable SPA delivered as single HTML bundle (`CareConnect-Pro.html`).
- **Mounting model:** Main shell loads login, dashboard, client tools, and injects feature modules (e.g., programs) via dynamic HTML fetch (`mountProgramsDocsModule()`).
- **Storage:** IndexedDB for client records (encrypted/partitioned); localStorage for user session + preferences; Blob downloads for PDF exports.
- **Security:** Strict CSP, `frame-ancestors 'none'`, sanitized inputs, no external APIs post-load (HIPAA aligned).
- **Supporting scripts:** Major brains live in root JS files (e.g., `dashboard-manager.js`, `client-manager.js`, `tracker-engine.js`, `document-generator.js`).

## 5. Navigation & UI System
- **Global header pattern:** Two-row sticky header defined in `CareConnect-Pro.html`.
  - **Row 1 (“Global Bar”):** Product branding, drawer toggle (`☰`), workspace tools, help, theme toggle, user profile.
  - **Row 2 (“Section Bar”):** Dynamic template via `ccShell.setSectionState()`. Shows context-specific controls except in Programs where the shell hides row 2 and defers to the module toolbar.
- **Navigation drawer:** `#appNavDrawer` (slide-out), houses Dashboard / Programs & Docs / Clients items. Keyboard shortcuts: `Ctrl/Cmd+M` to toggle, `Escape` to close, full focus trap.
- **Programs toolbar integration:** Programs V2 module exposes its own sticky toolbar aligned via `--app-shell-top-offset`. Section header is suppressed (`ccShell` hides the second row) when Programs is active.
- **Legacy tab bar:** Fully deprecated/hidden. Drawer is source of truth; fallback logic is disabled.

## 6. Major Workspaces
1. **Dashboard (`dashboardTab`):** Coach mission control; renders via `dashboardManager`, `dashboard-widgets.js`. Section header offers refresh + docs panel toggle.
2. **Programs & Docs (`programsTab` + injected module):** Three-pane explorer with filters, result cards, document builder, and sticky toolbar. Uses dataset in `programs.v2.json` plus real-time Chrome extension imports.
3. **Clients (`clientsTab`):** Rosters, quick actions (add client, refresh), and case timelines powered by `client-manager.js`.
4. **Authentication shell:** Login experience (before `#mainApp`) ensures proper gating for staff-only access.

## 7. File & Folder Orientation
- `CURRENT-VERSION-v12/` – **active bundle**; edit and preview from here.
- `CareConnect-Pro.html` – main shell, UI scaffolding, nav logic, global functions (exposed on `window.*`).
- `programs-docs-module.html` – Programs workspace HTML/CSS/JS (mounts into shell).
- `programs.v2.json` – curated dataset for modules.
- `dashboard-*.js`, `tracker-*.js`, `document-generator.js` – core feature engines referenced by shell.
- `dist/` – prior prototypes / archives (do not edit).
- Root-level `.md` files – training, onboarding, rollout documentation (legacy but useful context).

## 8. Design System & Styling Notes
- **CSS variables:** Defined at module roots (`:root` blocks) supplying color palette, shadows, radii, transitions.
- **App shell tokens:** `--app-shell-top-offset`, `--app-shell-total-header`, `--app-shell-header-z` govern stacking/spacing.
- **Layout rules:** Sticky header + sticky module toolbar; container spacing uses dynamic offsets to avoid overlap.
- **Buttons & chips:** `.section-chip`, `.app-header__icon-btn`, `.app-drawer__item` maintain consistent rounded design and hover states.
- **Theme toggle:** `toggleTheme()` updates theme classes and header label (`Dark Mode` vs `Light Mode`), with icon in `#themeIcon`.

## 9. Key Runtime Objects & Functions
- `window.ccShell` – Manages header templates, nav drawer state, focus handling, global shortcuts.
- `window.switchTab(tab)` – Unified tab activation (updates classes, triggers dashboard/program/client behaviors, persists `lastActiveTab`).
- Globalized helpers for drawer buttons and chips: `window.showSelectionPanel`, `window.refreshClientsList`, `window.showAddClientModal`, `window.refreshDashboard`, etc.
- Programs module lifecycle: `mountProgramsDocsModule()` fetches HTML, injects CSS, updates `ccShell.setSectionState('programs-loading' → 'programs')`, handles error fallback.
- Keyboard accessibility: `Escape` closes drawers/modals; `Ctrl/Cmd+M` toggles navigation; focus trap ensures accessibility compliance.

## 10. Development Workflow
- **Dev server:** From project root run  
  `cd CURRENT-VERSION-v12 && python -m http.server 8000`  
  → visit `http://localhost:8000/CareConnect-Pro.html`.
- **Build pipeline:** `npm run build` (uses `build-simple.js` to regenerate `dist/` bundle).
- **Static preview:** Open HTML file directly in browser (works offline after initial load).
- **Testing:** Use browser console + `dashboard-diagnostics.js` utilities (`Ctrl+Shift+D`) for health checks. Verify Programs tab after header changes due to sticky positioning.
- **Linting:** Manual (no automated lint step); ensure CSS/JS edits respect inline format and HIPAA constraints (no external calls).

## 11. Security & Compliance Checklist
- Content Security Policy updated with `frame-ancestors 'none'` to prevent embedding.
- Local-only processing; no PHI leaves device.
- Inputs sanitized before rendering; modal focus traps prevent background interaction leaks.
- Offline capable but requires secure distribution (USB / secure share) per Family First policies.

## 12. Recent UX Refactor (November 2025)
- Removed legacy blue hero bar; promoted dark programs toolbar to global master header.
- Implemented universal two-row header with dynamic section state.
- Added slide-out drawer navigation; all primary tabs moved inside.
- Ensured fallback functions exposed via `window` for new button actions.
- Updated Programs toolbar positioning (`top: var(--app-shell-top-offset)`) and styling (curved bottom only) for seamless integration.

## 12.1. Version 13 Stability Fixes (November 25, 2025)
- **Client Profile Modernization:** Replaced 1,300+ lines of legacy `viewClientDetails` code with modern `ClientProfileManager` delegation.
- **HousesManager Fix:** Added deferred initialization to prevent `ReferenceError` when scripts load asynchronously.
- **Encoding Fix:** Restored UTF-8 encoding to fix garbled emoji characters.
- **Panel Visibility:** Fixed floating "Document History" and "Program Comparison" panels with inline styles.
- **Code Quality:** Eliminated duplicate function definitions and shadowing issues.

## 13. Known Gaps & Follow-Ups
- Dashboard widgets require re-render guardrails when switching tabs quickly (monitor console warnings).
- Programs module still relies on large inline CSS/JS; consider modularizing into separate files for maintainability.
- Chrome extension integration path not yet documented in this bundle—needs dedicated section if onboarding extension developers.
- Future roadmap items (from onboarding guide): mobile app, voice commands, family portal, EMR integrations, insurance authorization automation.

## 14. Resources & Training Materials
- `ONBOARDING-GUIDE.md` – Origin story, mission, architecture deep dive.
- `QUICK-START-GUIDE.md` – 10-minute user ramp-up.
- `REFERENCE-CARD.md` – Printable cheat sheet (workflow, shortcuts, goals).
- `TRAINING-PRESENTATION.md` – Scripted 30-minute training session.
- `ROLLOUT-CHECKLIST.md` / `ROLLOUT-SUMMARY.md` – Launch planning and messaging.
- `TRAINING-PRESENTATION.md` – Slide-by-slide coach training narrative.

## 15. How To Contribute Safely
1. Work inside `CURRENT-VERSION-v12/`; leave `CareConnect-Pro_v12.1-STABLE.html` untouched (reference only).
2. Verify UI changes in both light/dark modes and on all primary tabs.
3. Check keyboard navigation (tab order, focus trapping) after DOM updates.
4. Run through one full Programs search + document export to ensure module injection still succeeds.
5. Document notable changes in this blueprint or commit messages for next contributor.

## 16. Quick Glossary
- **ccShell:** Controller object orchestrating the shell header/nav UI.
- **Programs V2 module:** Injected workspace providing program search + doc builder.
- **Milestone tracker:** Engine ensuring clinical tasks completed before discharge.
- **House Weather:** Dashboard visualization depicting overall house health.
- **Flight Plan:** Priority queue of tasks for coaches.

---

For questions or hand-off notes, append to this file so the next programmer has immediate context.

