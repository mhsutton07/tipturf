'use client';

import { cn } from '@/lib/utils';
import type { Platform } from '@/types';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'uber_eats', label: 'Uber Eats' },
  { value: 'doordash', label: 'DoorDash' },
  { value: 'instacart', label: 'Instacart' },
  { value: 'grubhub', label: 'Grubhub' },
  { value: 'amazon_flex', label: 'Amazon Flex' },
  { value: 'shipt', label: 'Shipt' },
  { value: 'other', label: 'Other' },
];

interface PlatformPickerProps {
  value: Platform | null;
  onChange: (platform: Platform) => void;
}

export function PlatformPicker({ value, onChange }: PlatformPickerProps) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-300 mb-2">Platform</p>
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[40px]',
              value === p.value
                ? 'bg-green-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
