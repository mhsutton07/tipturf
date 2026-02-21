'use client';


import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { StatCard } from '@/components/stats/StatCard';
import { LogItem } from '@/components/stats/LogItem';
import { useLocalLogs } from '@/hooks/useLocalLogs';
import { timeBucketLabel } from '@/lib/geo';
import { platformLabel, formatCurrency, formatPercent } from '@/lib/utils';
import type { Platform, TimeBucket } from '@/types';

const ALL_BUCKETS: TimeBucket[] = [
  'early_morning',
  'morning',
  'lunch',
  'afternoon',
  'dinner',
  'evening',
  'late_night',
];

export default function StatsPage() {
  const { logs, stats, deleteLog, isLoading } = useLocalLogs();
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayLogs = showAll ? logs : logs.slice(0, 20);

  // Best platform by tip rate
  let bestPlatform = 'N/A';
  if (stats && Object.keys(stats.byPlatform).length > 0) {
    const sorted = Object.entries(stats.byPlatform).sort(([, a], [, b]) => {
      const rateA = a.total > 0 ? a.tipped / a.total : 0;
      const rateB = b.total > 0 ? b.tipped / b.total : 0;
      return rateB - rateA;
    });
    if (sorted.length > 0) bestPlatform = platformLabel(sorted[0][0]);
  }

  // Max time bucket total for bar chart scaling
  const maxBucketTotal = stats
    ? Math.max(...ALL_BUCKETS.map((b) => stats.byTimeBucket[b]?.total ?? 0), 1)
    : 1;

  function handleExport() {
    if (logs.length === 0) return;
    const header = 'id,lat,lng,timeBucket,platform,tipped,tipAmount,date,notes,createdAt\n';
    const rows = logs
      .map((l: import('@/types').TipLog) =>
        [
          l.id,
          l.lat,
          l.lng,
          l.timeBucket,
          l.platform,
          l.tipped,
          l.tipAmount ?? '',
          l.date,
          l.notes ?? '',
          l.createdAt,
        ].join(',')
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tipturf-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <TopBar
        title="My Stats"
        right={
          <button
            onClick={handleExport}
            className="text-sm text-green-400 hover:text-green-300 transition-colors min-h-[44px] px-2"
          >
            Export CSV
          </button>
        }
      />
      <div className="pt-14 px-4 pb-8 flex flex-col gap-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <StatCard
            label="Total Logs"
            value={String(stats?.total ?? 0)}
            sub="deliveries recorded"
          />
          <StatCard
            label="Tip Rate"
            value={stats ? formatPercent(stats.tipRate) : '—'}
            accent={stats && stats.tipRate >= 0.7 ? 'green' : stats && stats.tipRate < 0.4 ? 'red' : 'yellow'}
            sub="of deliveries tipped"
          />
          <StatCard
            label="Avg Tip"
            value={stats && stats.avgTip > 0 ? formatCurrency(stats.avgTip) : '—'}
            accent="green"
            sub="when they tip"
          />
          <StatCard
            label="Best Platform"
            value={bestPlatform}
            sub="highest tip rate"
          />
        </div>

        {/* Time Bucket Breakdown */}
        {stats && stats.total > 0 && (
          <div className="bg-gray-900 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">By Time of Day</h2>
            <div className="flex flex-col gap-3">
              {ALL_BUCKETS.map((bucket) => {
                const data = stats.byTimeBucket[bucket];
                if (!data || data.total === 0) return null;
                const tipRate = data.tipped / data.total;
                const barWidth = Math.max((data.total / maxBucketTotal) * 100, 4);
                const barColor =
                  tipRate >= 0.7
                    ? 'bg-green-500'
                    : tipRate >= 0.4
                    ? 'bg-yellow-400'
                    : 'bg-red-500';

                return (
                  <div key={bucket}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{timeBucketLabel(bucket)}</span>
                      <span className="text-gray-300 font-medium">
                        {formatPercent(tipRate)} ({data.total} logs)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Platform Breakdown */}
        {stats && stats.total > 0 && Object.keys(stats.byPlatform).length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">By Platform</h2>
            <div className="flex flex-col gap-3">
              {Object.entries(stats.byPlatform).map(([platform, data]) => {
                const tipRate = data.total > 0 ? data.tipped / data.total : 0;
                return (
                  <div key={platform} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">{platformLabel(platform)}</p>
                      <p className="text-xs text-gray-500">{data.total} deliveries</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          tipRate >= 0.7
                            ? 'text-green-400'
                            : tipRate >= 0.4
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {formatPercent(tipRate)}
                      </p>
                      {data.avgTip > 0 && (
                        <p className="text-xs text-gray-500">
                          avg {formatCurrency(data.avgTip)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Logs */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">
            Recent Deliveries ({logs.length})
          </h2>
          {logs.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl p-8 text-center">
              <p className="text-gray-500 text-sm">No deliveries logged yet.</p>
              <p className="text-gray-600 text-xs mt-1">Tap Log to record your first delivery.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {displayLogs.map((log: import('@/types').TipLog) => (
                <LogItem key={log.id} log={log} onDelete={deleteLog} />
              ))}
              {logs.length > 20 && !showAll && (
                <button
                  onClick={() => setShowAll(true)}
                  className="text-sm text-green-400 hover:text-green-300 py-3 transition-colors"
                >
                  Show all {logs.length} deliveries
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
