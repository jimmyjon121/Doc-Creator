## Map 2.0 React Module

The immersive Leaflet-based map lives under `map-v2/` and ships as its own Vite bundle.

### Developer workflows

| Action | Command |
| --- | --- |
| Start dev server | `npm run map:dev` (from repo root) |
| Production build only | `npm run map:build` |
| Full CareConnect build (legacy + map) | `npm run build` |

The Vite build writes to `CURRENT-VERSION-v12/map-v2-dist/` so the embed can be opened directly from `CareConnect-Pro.html` (see the “Map 2.0” toolbar button) or via `file://`.

### Data + adapters

`map-v2/src/data/programDatabase.ts` adapts the legacy `programs.v2.json` / `window.programsData` shape into the typed `Program` model that React components consume. If you change the upstream data, update the adapter only.

### Component stack

- `FiltersBar` – floating chips/search
- `ProgramMap` – `react-leaflet` + clusters + custom markers
- `ProgramDrawer` – detail sheet with add-to-plan and compare actions (it also emits `programs-docs:add-program` to the legacy builder)
- `CompareBar` – bottom preview of up to four programs
- `CareConnectMapPage` – wires everything together and persists plan/compare IDs in `localStorage`

### Integration notes

- The existing map remains intact; clicking “Map 2.0” opens the React bundle in a new tab.
- Once Map 2.0 is validated, we can mount it inline by loading `map-v2-dist/assets/index-*.js` into the shell and calling `window.renderCareConnectMapV2(...)`.
- Styling respects the existing palette and supports dark mode via translucency; additional tweaks can live in Tailwind config (`map-v2/tailwind.config.js`).

