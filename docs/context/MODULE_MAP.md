# Module Map — TipTurf

## src/types/index.ts
```ts
export interface TipLog { id, lat, lng, timeBucket, platform, tipped, tipAmount?, date, notes?, createdAt, syncedAt?, communityId? }
export type TimeBucket = 'early_morning'|'morning'|'lunch'|'afternoon'|'dinner'|'evening'|'late_night'
export type Platform = 'uber_eats'|'doordash'|'instacart'|'grubhub'|'amazon_flex'|'shipt'|'other'
export interface CommunityPoint { lat, lng, tipRate, avgTip, count }
export interface HeatPoint { lat, lng, intensity }
export interface Stats { total, tipRate, avgTip, byPlatform, byTimeBucket }
```

## src/lib/geo.ts
```ts
export function snapCoord(n: number): number
export function getTimeBucket(date?: Date): TimeBucket
export function timeBucketLabel(tb: TimeBucket): string
export function timeBucketHours(tb: TimeBucket): [number, number]
export function aggregateToHeatPoints(logs: TipLog[]): HeatPoint[]
export function haversineDistance(lat1, lng1, lat2, lng2): number
```

## src/lib/db/local.ts
```ts
export class TipTurfDB extends Dexie { entries: Table<TipLog, string> }
export const db: TipTurfDB
export async function addLog(log: Omit<TipLog, 'id'|'createdAt'>): Promise<TipLog>
export async function getAllLogs(): Promise<TipLog[]>
export async function deleteLog(id: string): Promise<void>
export async function getLogsInBounds(minLat, maxLat, minLng, maxLng): Promise<TipLog[]>
export async function getStats(): Promise<Stats>
```

## src/lib/utils.ts
```ts
export function formatDate(dateStr: string): string
export function formatCurrency(amount: number): string
export function formatPercent(rate: number): string
export function cn(...classes: (string|undefined|null|false)[]): string
export function todayString(): string
export function platformLabel(platform: string): string
export function platformEmoji(platform: string): string
```

## src/lib/validators.ts
```ts
export const TipLogInputSchema: ZodObject
export type TipLogInput = z.infer<typeof TipLogInputSchema>
```

## src/hooks/useLocalLogs.ts
```ts
export function useLocalLogs(): { logs: TipLog[], addLog, deleteLog, stats: Stats|null, isLoading: boolean }
```

## src/hooks/useGeolocation.ts
```ts
export function useGeolocation(): { lat: number|null, lng: number|null, error: string|null, loading: boolean, refresh: () => void }
```

## src/hooks/useAuth.ts
```ts
export function useAuth(): { user, session, signIn, signOut, loading }
```

## src/app/api/logs/route.ts
```ts
export async function GET(request: NextRequest): Promise<NextResponse>   // bounding box aggregate query
export async function POST(request: NextRequest): Promise<NextResponse>  // submit community log
```

## src/lib/supabase/client.ts
```ts
export const supabase: SupabaseClient | null
```
