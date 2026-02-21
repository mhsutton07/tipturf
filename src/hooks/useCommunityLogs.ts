'use client';

import { useState, useEffect } from 'react';
import type { CommunityPoint } from '@/types';

interface UseCommunityLogsOptions {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  enabled?: boolean;
}

export function useCommunityLogs({
  minLat,
  maxLat,
  minLng,
  maxLng,
  enabled = false,
}: UseCommunityLogsOptions) {
  const [points, setPoints] = useState<CommunityPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      minLat: String(minLat),
      maxLat: String(maxLat),
      minLng: String(minLng),
      maxLng: String(maxLng),
    });

    fetch(`/api/logs?${params}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setPoints(data.points ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [minLat, maxLat, minLng, maxLng, enabled]);

  return { points, loading, error };
}
