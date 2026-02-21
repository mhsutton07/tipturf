'use client';

import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'red' | 'yellow' | 'default';
}

export function StatCard({ label, value, sub, accent = 'default' }: StatCardProps) {
  const accentColors: Record<string, string> = {
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    default: 'text-white',
  };

  return (
    <div className="bg-gray-900 rounded-2xl p-4 flex flex-col gap-1">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={cn('text-2xl font-bold', accentColors[accent])}>{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}
