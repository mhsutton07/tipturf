'use client';

import { cn, platformLabel, formatDate } from '@/lib/utils';
import { timeBucketLabel } from '@/lib/geo';
import type { TipLog } from '@/types';

interface LogItemProps {
  log: TipLog;
  onDelete?: (id: string) => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  uber_eats: 'bg-black text-white',
  doordash: 'bg-red-600 text-white',
  instacart: 'bg-green-600 text-white',
  grubhub: 'bg-orange-500 text-white',
  amazon_flex: 'bg-yellow-400 text-black',
  shipt: 'bg-red-500 text-white',
  other: 'bg-gray-600 text-white',
};

const PLATFORM_ABBR: Record<string, string> = {
  uber_eats: 'UE',
  doordash: 'DD',
  instacart: 'IC',
  grubhub: 'GH',
  amazon_flex: 'AF',
  shipt: 'SH',
  other: '??',
};

export function LogItem({ log, onDelete }: LogItemProps) {
  return (
    <div className="flex items-center gap-3 bg-gray-900 rounded-2xl p-4">
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
          PLATFORM_COLORS[log.platform] ?? 'bg-gray-700 text-white'
        )}
      >
        {PLATFORM_ABBR[log.platform] ?? '??'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{platformLabel(log.platform)}</p>
        <p className="text-xs text-gray-500">
          {timeBucketLabel(log.timeBucket)} &middot; {formatDate(log.date)}
        </p>
        <p className="text-xs text-gray-600 mt-0.5">
          {log.lat}, {log.lng}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1">
        {log.tipped ? (
          <span className="text-green-400 font-semibold text-sm">
            {log.tipAmount != null ? `$${log.tipAmount.toFixed(2)}` : 'Tipped'}
          </span>
        ) : (
          <span className="text-red-400 font-semibold text-sm">No tip</span>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(log.id)}
            className="text-xs text-gray-600 hover:text-red-400 transition-colors min-h-[32px] px-1"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
