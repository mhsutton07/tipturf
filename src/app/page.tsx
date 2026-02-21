'use client';


import dynamicImport from 'next/dynamic';
import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { cn } from '@/lib/utils';
import type { Platform, TimeBucket } from '@/types';
import Link from 'next/link';

const TipTurf = dynamicImport(() => import('@/components/map/TipTurf'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading map...</p>
      </div>
    </div>
  ),
});

const PLATFORMS: { value: Platform | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'uber_eats', label: 'Uber Eats' },
  { value: 'doordash', label: 'DoorDash' },
  { value: 'instacart', label: 'Instacart' },
  { value: 'grubhub', label: 'Grubhub' },
  { value: 'amazon_flex', label: 'Amazon Flex' },
  { value: 'shipt', label: 'Shipt' },
  { value: 'other', label: 'Other' },
];

const TIME_BUCKETS: { value: TimeBucket | 'all'; label: string }[] = [
  { value: 'all', label: 'All Day' },
  { value: 'early_morning', label: 'Early AM' },
  { value: 'morning', label: 'Morning' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'evening', label: 'Evening' },
  { value: 'late_night', label: 'Late Night' },
];

export default function MapPage() {
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [timeBucketFilter, setTimeBucketFilter] = useState<TimeBucket | 'all'>('all');

  return (
    <div className="fixed inset-0 pb-16 flex flex-col">
      {/* Filter bar */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gray-950/80 backdrop-blur-sm pt-safe-top">
        <div className="overflow-x-auto">
          <div className="flex gap-2 px-3 py-2 min-w-max">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPlatformFilter(p.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[32px]',
                  platformFilter === p.value
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-2 px-3 pb-2 min-w-max">
            {TIME_BUCKETS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTimeBucketFilter(t.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[32px]',
                  timeBucketFilter === t.value
                    ? 'bg-yellow-400 text-gray-950'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 mt-[88px]">
        <TipTurf
          platformFilter={platformFilter}
          timeBucketFilter={timeBucketFilter}
        />
      </div>

      {/* FAB */}
      <Link
        href="/log"
        className="absolute bottom-20 right-4 z-30 w-14 h-14 bg-green-500 hover:bg-green-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-900/40 transition-colors"
        aria-label="Log a delivery"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
        </svg>
      </Link>

      {/* Legend */}
      <div className="absolute bottom-20 left-4 z-30 bg-gray-900/90 backdrop-blur-sm rounded-xl px-3 py-2">
        <p className="text-[10px] text-gray-400 mb-1">Heat Map</p>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-[10px] text-gray-400">No data</span>
          <div className="w-3 h-3 rounded-full bg-red-500 ml-1" />
          <span className="text-[10px] text-gray-400">Low tips</span>
          <div className="w-3 h-3 rounded-full bg-green-500 ml-1" />
          <span className="text-[10px] text-gray-400">Good tips</span>
        </div>
      </div>
    </div>
  );
}
