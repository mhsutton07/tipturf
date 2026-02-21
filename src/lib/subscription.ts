// Single source of truth for all paywall / subscription checks.
// No other file should re-implement this logic.

const DEV_EMAILS = (process.env.DEV_BYPASS_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

export function isSubscribed(user: {
  email: string;
  stripe_status?: string | null;
}): boolean {
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_BYPASS_PAYWALL === 'true') return true;
  if (DEV_EMAILS.includes(user.email)) return true;
  return user.stripe_status === 'active';
}
