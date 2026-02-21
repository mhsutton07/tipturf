import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { TipLogInputSchema } from '@/lib/validators';
import { snapCoord } from '@/lib/geo';
import { isSubscribed } from '@/lib/subscription';

// GET /api/logs?minLat=&maxLat=&minLng=&maxLng=&platform=&timeBucket=
// Returns aggregated tip rates per grid cell — never raw rows
// Requires an active Pro subscription.
export async function GET(request: NextRequest) {
  const supabase = createServerClient();

  if (!supabase) {
    return NextResponse.json(
      {
        error: 'Community data not yet configured.',
        message: 'TODO: add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars',
        points: [],
      },
      { status: 501 }
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 });
  }

  const { data: userRow } = await supabase
    .from('profiles')
    .select('email, stripe_status')
    .eq('id', user.id)
    .single();

  if (!userRow || !isSubscribed({ email: userRow.email, stripe_status: userRow.stripe_status })) {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const minLat = parseFloat(searchParams.get('minLat') ?? '');
  const maxLat = parseFloat(searchParams.get('maxLat') ?? '');
  const minLng = parseFloat(searchParams.get('minLng') ?? '');
  const maxLng = parseFloat(searchParams.get('maxLng') ?? '');

  if ([minLat, maxLat, minLng, maxLng].some(isNaN)) {
    return NextResponse.json({ error: 'minLat, maxLat, minLng, maxLng are required' }, { status: 400 });
  }

  const LAT_SPAN_MAX = 2;
  const LNG_SPAN_MAX = 2;
  if (maxLat - minLat > LAT_SPAN_MAX || maxLng - minLng > LNG_SPAN_MAX) {
    return NextResponse.json({ error: 'Viewport too large' }, { status: 400 });
  }

  const platform = searchParams.get('platform');
  const timeBucket = searchParams.get('timeBucket');

  let query = supabase
    .from('tip_logs')
    .select('lat, lng, tipped')
    .gte('lat', minLat)
    .lte('lat', maxLat)
    .gte('lng', minLng)
    .lte('lng', maxLng);

  if (platform) query = query.eq('platform', platform);
  if (timeBucket) query = query.eq('time_bucket', timeBucket);

  const { data, error } = await query;

  if (error) {
    console.error('[GET /api/logs]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // Aggregate per grid cell — never expose raw rows
  const cells = new Map<string, { tipped: number; total: number }>();
  for (const row of data ?? []) {
    const key = `${row.lat},${row.lng}`;
    const cell = cells.get(key) ?? { tipped: 0, total: 0 };
    cell.total++;
    if (row.tipped) cell.tipped++;
    cells.set(key, cell);
  }

  const points = Array.from(cells.entries()).map(([key, cell]) => {
    const [lat, lng] = key.split(',').map(Number);
    return {
      lat,
      lng,
      tipRate: cell.tipped / cell.total,
      count: cell.total,
    };
  });

  return NextResponse.json({ points });
}

// POST /api/logs — requires auth (Phase 2)
export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  if (!supabase) {
    return NextResponse.json(
      {
        error: 'Not Implemented',
        message: 'TODO: add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars',
      },
      { status: 501 }
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: userRow } = await supabase
    .from('profiles')
    .select('email, stripe_status')
    .eq('id', user.id)
    .single();
  if (!userRow || !isSubscribed({ email: userRow.email, stripe_status: userRow.stripe_status })) {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = TipLogInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Re-snap coordinates server-side to prevent cheating
  const { error } = await supabase.from('tip_logs').insert({
    lat: snapCoord(data.lat),
    lng: snapCoord(data.lng),
    time_bucket: data.timeBucket,
    platform: data.platform,
    tipped: data.tipped,
    report_date: data.date,
    notes: data.notes,
  });

  if (error) {
    console.error('[POST /api/logs]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
