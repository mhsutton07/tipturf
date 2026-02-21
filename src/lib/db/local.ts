import Dexie, { type Table } from 'dexie';
import type { TipLog, Platform, TimeBucket, Stats } from '@/types';
import { snapCoord } from '@/lib/geo';

export class TipTurfDB extends Dexie {
  entries!: Table<TipLog, string>;

  constructor() {
    super('TipTurfDB');
    this.version(1).stores({
      entries: 'id, lat, lng, platform, date, createdAt',
    });
  }
}

export const db = new TipTurfDB();

export async function addLog(
  log: Omit<TipLog, 'id' | 'createdAt'>
): Promise<TipLog> {
  const entry: TipLog = {
    ...log,
    lat: snapCoord(log.lat),
    lng: snapCoord(log.lng),
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await db.entries.add(entry);
  return entry;
}

export async function getAllLogs(): Promise<TipLog[]> {
  return db.entries.orderBy('createdAt').reverse().toArray();
}

export async function deleteLog(id: string): Promise<void> {
  await db.entries.delete(id);
}

export async function getLogsInBounds(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number
): Promise<TipLog[]> {
  return db.entries
    .where('lat')
    .between(minLat, maxLat, true, true)
    .filter((log) => log.lng >= minLng && log.lng <= maxLng)
    .toArray();
}

export async function getStats(): Promise<Stats> {
  const logs = await getAllLogs();
  const total = logs.length;

  if (total === 0) {
    return {
      total: 0,
      tipRate: 0,
      avgTip: 0,
      byPlatform: {} as Stats['byPlatform'],
      byTimeBucket: {} as Stats['byTimeBucket'],
    };
  }

  const tippedLogs = logs.filter((l) => l.tipped);
  const tipRate = tippedLogs.length / total;
  const tipsWithAmount = tippedLogs.filter((l) => l.tipAmount != null);
  const avgTip =
    tipsWithAmount.length > 0
      ? tipsWithAmount.reduce((sum, l) => sum + (l.tipAmount ?? 0), 0) /
        tipsWithAmount.length
      : 0;

  const byPlatform = {} as Stats['byPlatform'];
  const byTimeBucket = {} as Stats['byTimeBucket'];

  for (const log of logs) {
    if (!byPlatform[log.platform]) {
      byPlatform[log.platform] = { total: 0, tipped: 0, avgTip: 0 };
    }
    byPlatform[log.platform].total++;
    if (log.tipped) {
      byPlatform[log.platform].tipped++;
      if (log.tipAmount != null) {
        const prev = byPlatform[log.platform];
        const prevTotal = prev.tipped - 1;
        prev.avgTip = (prev.avgTip * prevTotal + log.tipAmount) / prev.tipped;
      }
    }

    if (!byTimeBucket[log.timeBucket]) {
      byTimeBucket[log.timeBucket] = { total: 0, tipped: 0 };
    }
    byTimeBucket[log.timeBucket].total++;
    if (log.tipped) byTimeBucket[log.timeBucket].tipped++;
  }

  return { total, tipRate, avgTip, byPlatform, byTimeBucket };
}
