import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App.tsx';
import type { Program } from './types/Program';
import type { FiltersState } from './components/map/FiltersBar';
import { DEFAULT_FILTERS } from './pages/CareConnectMapPage';

type MapV2RenderOptions = {
  programs?: Program[];
  initialFilters?: FiltersState;
  onFiltersChange?: (filters: FiltersState) => void;
};

let hostedRoot: Root | null = null;
let hostedElement: HTMLElement | null = null;

function renderMap(element: HTMLElement, options?: MapV2RenderOptions) {
  if (!element) {
    throw new Error('CareConnectMapV2.render requires a container element');
  }
  if (!hostedRoot || hostedElement !== element) {
    if (hostedRoot) {
      hostedRoot.unmount();
    }
    hostedElement = element;
    hostedRoot = createRoot(element);
  }
  hostedRoot.render(
    <StrictMode>
      <App {...options} />
    </StrictMode>,
  );
}

function destroyMap() {
  if (hostedRoot) {
    hostedRoot.unmount();
    hostedRoot = null;
  }
  hostedElement = null;
}

declare global {
  interface Window {
    CareConnectMapV2?: {
      render: typeof renderMap;
      destroy: typeof destroyMap;
      DEFAULT_FILTERS: typeof DEFAULT_FILTERS;
    };
  }
}

window.CareConnectMapV2 = {
  render: renderMap,
  destroy: destroyMap,
  DEFAULT_FILTERS,
};

const standaloneRoot = document.getElementById('root');
if (standaloneRoot) {
  renderMap(standaloneRoot);
}
