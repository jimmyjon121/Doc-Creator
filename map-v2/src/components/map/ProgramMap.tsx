import React, { useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L, { type LatLngExpression } from 'leaflet';
import type { Program } from '../../types/Program';
import { getProgramColor } from './constants';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: LatLngExpression = [39.5, -98.35];
const DEFAULT_ZOOM = 4;

delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png').toString(),
  iconUrl: new URL('https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png').toString(),
  shadowUrl: new URL('https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png').toString(),
});

interface ProgramMapProps {
  programs: Program[];
  onProgramClick: (program: Program | null) => void;
}

function createMarkerIcon(color: string) {
  return L.divIcon({
    html: `<div style="
        width: 28px;
        height: 28px;
        border-radius: 999px;
        background:${color};
        box-shadow:0 0 0 3px #ffffffdd;
        display:flex;
        align-items:center;
        justify-content:center;
        color:white;
        font-size:12px;
        font-weight:700;
      "></div>`,
    className: 'careconnect-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div style="
        width: 42px;
        height: 42px;
        border-radius:999px;
        background:linear-gradient(135deg,#4c5bff,#8b5cf6);
        color:white;
        font-size:14px;
        font-weight:700;
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow:0 16px 32px rgba(15,23,42,0.35);
      ">${count}</div>`,
    className: 'careconnect-cluster',
    iconSize: L.point(42, 42, true),
  });
}

const MapClickHandler: React.FC<{ onBackgroundClick: () => void }> = ({ onBackgroundClick }) => {
  useMapEvents({
    click: (event) => {
      const target = event.originalEvent.target as HTMLElement;
      if (!target.closest('.leaflet-marker-icon')) {
        onBackgroundClick();
      }
    },
  });

  return null;
};

export const ProgramMap: React.FC<ProgramMapProps> = ({ programs, onProgramClick }) => {
  const clusterPrograms = useMemo(
    () =>
      programs.map((program) => ({
        ...program,
        icon: createMarkerIcon(getProgramColor(program)),
      })),
    [programs],
  );

  return (
    <div className="relative h-full w-full rounded-[24px] overflow-hidden">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={3}
        maxZoom={18}
        className="h-full w-full"
        preferCanvas
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onBackgroundClick={() => onProgramClick(null)} />

        <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterIcon}>
          {clusterPrograms.map((program) => (
            <Marker
              key={program.id}
              position={[program.lat, program.lng]}
              icon={program.icon}
              eventHandlers={{
                click: () => onProgramClick(program),
              }}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

