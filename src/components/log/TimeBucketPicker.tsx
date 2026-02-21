'use client';

import { cn } from '@/lib/utils';
import { timeBucketLabel, timeBucketHours } from '@/lib/geo';
import type { TimeBucket } from '@/types';

const BUCKETS: TimeBucket[] = [
  'early_morning',
  'morning',
  'lunch',
  'afternoon',
  'dinner',
  'evening',
  'late_night',
];

const BUCKET_ICONS: Record<TimeBucket, string> = {
  early_morning: '🌅',
  morning: '☀️',
  lunch: '🍱',
  afternoon: '🌤',
  dinner: '🌙',
  evening: '🌃',
  late_night: '🌑',
};

interface TimeBucketPickerProps {
  value: TimeBucket;
  onChange: (bucket: TimeBucket) => void;
}

export function TimeBucketPicker({ value, onChange }: TimeBucketPickerProps) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-300 mb-2">Time of Day</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {BUCKETS.map((bucket) => {
          const [start, end] = timeBucketHours(bucket);
          return (
            <button
              key={bucket}
              type="button"
              onClick={() => onChange(bucket)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-colors min-h-[56px]',
                value === bucket
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
              )}
            >
              <span className="text-base">{BUCKET_ICONS[bucket]}</span>
              <span className="font-medium leading-tight text-center">
                {timeBucketLabel(bucket).split(' ')[0]}
              </span>
              <span className="opacity-70">
                {start}–{end}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
