# CareConnect Pro Versions

## Current Release
- Version: **v12.2-dashboard** (Coach Dashboard refresh)
- Location: `CURRENT-VERSION-v12/`
- Deliverable: copy of `dist/` after build (`CareConnect-Pro.html`, launch scripts, README)
- Notes: New coach dashboard layout, Tracker Compliance grid, demo-mode wiring, Programs & Docs loader fallback.

## Previous Releases
- **v12.1-clean** – first cleaned v12 app bundle; reference snapshot in `CURRENT-VERSION-v12/CareConnect-Pro_v12.1-STABLE.html`.
- **v12.0-pre-clean** – initial v12 series before repo cleanup (see tag `v12.0-pre-clean`).

## Structure Expectations
```
Doc-Creator/
|- CURRENT-VERSION-v12/         # latest packaged build (mirrors dist)
|- dist/                        # rebuilds here on demand
|- enhancements/                # live patches
|- src/                         # reference modules
\- AppsCode-DeluxeCMS.html     # editable source
```

## Release Steps
1. Run `npm run clean && npm run build`
2. Smoke test: login, dashboard tabs, clients, document generation, IndexedDB export/import
3. Copy `dist/` -> `CURRENT-VERSION-v12/`
4. Commit & tag (`v12.x`) with notes in `CHANGELOG`

## Legacy Archive
- v11.x and older assets removed from working tree (see git history before `v12.0-pre-clean`)
- Chrome extension bundles archived in tag history only

_Last updated: November 16, 2025_
