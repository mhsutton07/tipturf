'use client';

import { useMap } from 'react-leaflet';

interface LocationButtonProps {
  lat: number | null;
  lng: number | null;
  onRefresh: () => void;
  loading?: boolean;
}

export function LocationButton({ lat, lng, onRefresh, loading }: LocationButtonProps) {
  const map = useMap();

  function handleClick() {
    onRefresh();
    if (lat != null && lng != null) {
      map.setView([lat, lng], 14);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label="Center on my location"
      className="absolute bottom-24 right-4 z-[400] w-12 h-12 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <circle cx="12" cy="12" r="3" />
          <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      )}
    </button>
  );
}
