# CareConnect Pro v12 - Developer Guide

## Quick Build
- npm install
- npm run clean && npm run build
- Open dist/CareConnect-Pro.html

## Repo Layout (cleaned for v12)
```
Doc-Creator/
|- AppsCode-DeluxeCMS.html      # source of truth (single-file app)
|- build-simple.js              # only build path
|- dist/                        # build output (overwrites each run)
|- enhancements/                # custom JS/CSS patches
|- src/                         # extracted reference modules
|- CURRENT-VERSION-v12/         # pinned release bundle (copied from dist)
|- package.json                 # scripts + clean/build
\- README-MODULAR.md           # this guide
```

## Daily Workflow
1. Edit `AppsCode-DeluxeCMS.html` or files in `enhancements/`
2. Run `npm run clean && npm run build`
3. Verify `dist/CareConnect-Pro.html`
4. Copy the `dist/` folder to `CURRENT-VERSION-v12/` when tagging a release

## Enhancements
- Drop CSS in `enhancements/styles.css`
- Feature toggles / bug fixes live in `enhancements/*.js`
- Scripts load in the order defined inside `build-simple.js`

## Utilities
- Shared front-end helpers now live in `src/js/utils.js`
- Global access: `CareConnect.utils`

## Release Checklist
- Build succeeds with no console errors
- Login, dashboard, clients, and document generation flows work
- IndexedDB export/import validated (Settings -> Data Tools)
- Update `VERSIONS-MASTER-LIST.md` and tag (e.g., `v12.1-clean`)

_Last updated: November 6, 2025_
