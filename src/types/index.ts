export interface TipLog {
  id: string;
  lat: number;
  lng: number;
  timeBucket: TimeBucket;
  platform: Platform;
  tipped: boolean;
  tipAmount?: number;
  date: string;
  notes?: string;
  createdAt: string;
  syncedAt?: string;
  communityId?: string;
}

export type TimeBucket =
  | 'early_morning'
  | 'morning'
  | 'lunch'
  | 'afternoon'
  | 'dinner'
  | 'evening'
  | 'late_night';

export type Platform =
  | 'uber_eats'
  | 'doordash'
  | 'instacart'
  | 'grubhub'
  | 'amazon_flex'
  | 'shipt'
  | 'other';

export interface CommunityPoint {
  lat: number;
  lng: number;
  tipRate: number;
  avgTip: number;
  count: number;
}

export interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export interface Stats {
  total: number;
  tipRate: number;
  avgTip: number;
  byPlatform: Record<Platform, { total: number; tipped: number; avgTip: number }>;
  byTimeBucket: Record<TimeBucket, { total: number; tipped: number }>;
}

export type StripeStatus = 'active' | 'past_due' | 'canceled' | 'inactive';

export interface UserRecord {
  id: string;
  email: string;
  stripe_customer_id?: string | null;
  stripe_status?: StripeStatus | null;
}
