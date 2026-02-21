'use client';

import { useState, useCallback } from 'react';

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
  source: 'gps' | 'zip' | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    error: null,
    loading: false,
    source: null,
  });

  const refresh = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported' }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          error: null,
          loading: false,
          source: 'gps',
        });
      },
      (err) => {
        setState((s) => ({
          ...s,
          error: err.message,
          loading: false,
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  const resolveZip = useCallback(async (zip: string): Promise<boolean> => {
    const trimmed = zip.trim();
    if (!/^\d{5}$/.test(trimmed)) return false;

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${trimmed}&country=us&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (!data.length) {
        setState((s) => ({ ...s, loading: false, error: 'ZIP code not found' }));
        return false;
      }
      setState({
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        error: null,
        loading: false,
        source: 'zip',
      });
      return true;
    } catch {
      setState((s) => ({ ...s, loading: false, error: 'Could not look up ZIP code' }));
      return false;
    }
  }, []);

  return { ...state, refresh, resolveZip };
}
