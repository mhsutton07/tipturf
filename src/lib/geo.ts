import type { TimeBucket, TipLog, HeatPoint } from '@/types';

export function snapCoord(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function getTimeBucket(date?: Date): TimeBucket {
  const hour = (date ?? new Date()).getHours();
  if (hour >= 5 && hour < 9) return 'early_morning';
  if (hour >= 9 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'dinner';
  if (hour >= 20 && hour < 23) return 'evening';
  return 'late_night';
}

export function timeBucketLabel(tb: TimeBucket): string {
  const labels: Record<TimeBucket, string> = {
    early_morning: 'Early Morning',
    morning: 'Morning',
    lunch: 'Lunch',
    afternoon: 'Afternoon',
    dinner: 'Dinner',
    evening: 'Evening',
    late_night: 'Late Night',
  };
  return labels[tb];
}

export function timeBucketHours(tb: TimeBucket): [number, number] {
  const hours: Record<TimeBucket, [number, number]> = {
    early_morning: [5, 9],
    morning: [9, 12],
    lunch: [12, 14],
    afternoon: [14, 17],
    dinner: [17, 20],
    evening: [20, 23],
    late_night: [23, 5],
  };
  return hours[tb];
}

export function aggregateToHeatPoints(logs: TipLog[]): HeatPoint[] {
  const cells = new Map<string, { tipped: number; total: number; tipAmounts: number[] }>();

  for (const log of logs) {
    const key = `${log.lat},${log.lng}`;
    const cell = cells.get(key) ?? { tipped: 0, total: 0, tipAmounts: [] };
    cell.total++;
    if (log.tipped) {
      cell.tipped++;
      if (log.tipAmount != null) cell.tipAmounts.push(log.tipAmount);
    }
    cells.set(key, cell);
  }

  const points: HeatPoint[] = [];
  for (const [key, cell] of Array.from(cells.entries())) {
    const [lat, lng] = key.split(',').map(Number);
    const tipRate = cell.tipped / cell.total;
    const avgTip =
      cell.tipAmounts.length > 0
        ? cell.tipAmounts.reduce((a: number, b: number) => a + b, 0) / cell.tipAmounts.length
        : 0;
    const normalizedAvgTip = Math.min(avgTip / 10, 1);
    const intensity = tipRate * 0.6 + normalizedAvgTip * 0.4;
    points.push({ lat, lng, intensity });
  }

  return points;
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
