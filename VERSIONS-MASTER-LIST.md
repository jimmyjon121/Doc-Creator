# CareConnect Pro Versions

## ✅ Current Release
- Version: **v12.1-clean** (tag after QA)
- Location: CURRENT-VERSION-v12/
- Deliverable: copy of dist/ after build (CareConnect-Pro.html, launch scripts, README)
- Notes: Legacy folders removed from active repo tree (Nov 6, 2025)

## Previous Release
- Version: **v12.0** (pre-clean)
- Tag: 12.0-pre-clean
- Snapshot: see Git tag for full history

## Structure Expectations
`
Doc-Creator/
├── CURRENT-VERSION-v12/         # latest packaged build (mirrors dist)
├── dist/                        # rebuilds here on demand
├── enhancements/                # live patches
├── src/                         # reference modules
└── AppsCode-DeluxeCMS.html      # editable source
`

## Release Steps
1. 
pm run clean && npm run build
2. Smoke test: login, dashboard tabs, clients, document generation, IndexedDB export/import
3. Copy dist/ → CURRENT-VERSION-v12/
4. Commit & tag (12.x) with notes in CHANGELOG

## Legacy Archive
- v11.x and older assets removed from working tree (see git history < v12.0-pre-clean)
- Chrome extension bundles archived in tag history only

_Last updated: November 6, 2025_
