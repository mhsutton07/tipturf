'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { HeatLayer } from './HeatLayer';
import { LocationButton } from './LocationButton';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useLocalLogs } from '@/hooks/useLocalLogs';
import { aggregateToHeatPoints } from '@/lib/geo';
import type { Platform, TimeBucket, TipLog } from '@/types';

// Fix Leaflet default marker icon in Next.js
import L from 'leaflet';
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapCenterer({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], 13);
    }
  }, [lat, lng, map]);
  return null;
}

interface TipTurfProps {
  platformFilter: Platform | 'all';
  timeBucketFilter: TimeBucket | 'all';
}

export default function TipTurf({ platformFilter, timeBucketFilter }: TipTurfProps) {
  const { lat, lng, loading: geoLoading, error: geoError, refresh, resolveZip } = useGeolocation();
  const [zipInput, setZipInput] = useState('');
  const [showZip, setShowZip] = useState(false);
  const { logs } = useLocalLogs();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    refresh();
    setMapReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (geoError && lat == null) setShowZip(true);
  }, [geoError, lat]);

  const filteredLogs = logs.filter((log: TipLog) => {
    if (platformFilter !== 'all' && log.platform !== platformFilter) return false;
    if (timeBucketFilter !== 'all' && log.timeBucket !== timeBucketFilter) return false;
    return true;
  });

  const heatPoints = aggregateToHeatPoints(filteredLogs);

  const center: [number, number] =
    lat != null && lng != null ? [lat, lng] : [37.7749, -122.4194];

  if (!mapReady) return null;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={13}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapCenterer lat={lat} lng={lng} />
        {heatPoints.length > 0 && <HeatLayer points={heatPoints} />}
        <LocationButton lat={lat} lng={lng} onRefresh={refresh} loading={geoLoading} />
      </MapContainer>

      {/* ZIP code fallback — shown when GPS is denied */}
      {showZip && lat == null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 shadow-xl w-[calc(100%-2rem)] max-w-sm">
          <p className="text-xs text-yellow-400 font-medium mb-2">GPS off — enter your ZIP to center the map</p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{5}"
              maxLength={5}
              placeholder="ZIP code"
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value.replace(/\D/g, ''))}
              className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm min-h-[40px]"
            />
            <button
              type="button"
              disabled={zipInput.length !== 5 || geoLoading}
              onClick={async () => {
                const ok = await resolveZip(zipInput);
                if (ok) setShowZip(false);
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
            >
              {geoLoading ? '...' : 'Go'}
            </button>
            <button
              type="button"
              onClick={() => setShowZip(false)}
              className="px-3 py-2 text-gray-500 hover:text-gray-300 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
