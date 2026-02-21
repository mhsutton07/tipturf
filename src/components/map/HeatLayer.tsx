'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { HeatPoint } from '@/types';

interface HeatLayerProps {
  points: HeatPoint[];
}

export function HeatLayer({ points }: HeatLayerProps) {
  const map = useMap();
  const layerRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!map) return;

    // Remove previous layer
    layerRef.current?.remove();
    layerRef.current = null;

    if (points.length === 0) return;

    const latlngs = points.map(
      (p): [number, number, number] => [p.lat, p.lng, p.intensity]
    );

    // leaflet.heat patches L at import time
    Promise.all([import('leaflet'), import('leaflet.heat')]).then(([L]) => {
      // After importing leaflet.heat, L.heatLayer is available
      const LWithHeat = L as unknown as {
        heatLayer: (
          latlngs: Array<[number, number, number]>,
          options: object
        ) => { addTo: (m: object) => { remove: () => void }; remove: () => void };
      };

      if (!LWithHeat.heatLayer) return;

      const layer = LWithHeat.heatLayer(latlngs, {
        radius: 35,
        blur: 25,
        minOpacity: 0.4,
        gradient: {
          0.0: 'blue',
          0.3: 'red',
          0.6: 'yellow',
          1.0: 'green',
        },
      });

      layer.addTo(map);
      layerRef.current = layer;
    });

    return () => {
      layerRef.current?.remove();
      layerRef.current = null;
    };
  }, [map, points]);

  return null;
}
