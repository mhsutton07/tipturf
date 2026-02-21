'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlatformPicker } from './PlatformPicker';
import { TimeBucketPicker } from './TimeBucketPicker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLocalLogs } from '@/hooks/useLocalLogs';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getTimeBucket, snapCoord } from '@/lib/geo';
import { todayString } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import type { Platform, TimeBucket } from '@/types';

export function LogForm() {
  const router = useRouter();
  const { addLog } = useLocalLogs();
  const { lat, lng, loading: geoLoading, error: geoError, source: geoSource, refresh, resolveZip } = useGeolocation();
  const { toast } = useToast();

  const [platform, setPlatform] = useState<Platform | null>(null);
  const [timeBucket, setTimeBucket] = useState<TimeBucket>(getTimeBucket());
  const [tipped, setTipped] = useState<boolean | null>(null);
  const [tipAmount, setTipAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [zip, setZip] = useState('');
  const [zipLookedUp, setZipLookedUp] = useState(false);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!platform) newErrors.platform = 'Select a platform';
    if (tipped === null) newErrors.tipped = 'Did they tip?';
    if (lat == null || lng == null) newErrors.location = 'GPS location required';
    if (notes.length > 140) newErrors.notes = 'Max 140 characters';
    if (tipped && tipAmount && (Number(tipAmount) < 0.01 || Number(tipAmount) > 99.99)) {
      newErrors.tipAmount = 'Amount must be $0.01–$99.99';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    if (!platform || tipped === null || lat == null || lng == null) return;

    setSaving(true);
    try {
      await addLog({
        lat: snapCoord(lat),
        lng: snapCoord(lng),
        timeBucket,
        platform,
        tipped,
        tipAmount: tipped && tipAmount ? parseFloat(tipAmount) : undefined,
        date: todayString(),
        notes: notes.trim() || undefined,
      });
      toast('Delivery logged!', 'success');
      router.push('/');
    } catch (err) {
      toast('Failed to save. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 pb-24">
      <PlatformPicker value={platform} onChange={setPlatform} />
      {errors.platform && <p className="text-xs text-red-400 -mt-4">{errors.platform}</p>}

      <TimeBucketPicker value={timeBucket} onChange={setTimeBucket} />

      <div>
        <p className="text-sm font-medium text-gray-300 mb-3">Did they tip?</p>
        {errors.tipped && <p className="text-xs text-red-400 mb-2">{errors.tipped}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTipped(true)}
            className={`flex flex-col items-center justify-center rounded-2xl min-h-[88px] text-xl font-bold transition-all ${
              tipped === true
                ? 'bg-green-500 text-white ring-2 ring-green-300 scale-[1.02]'
                : 'bg-gray-800 text-green-400 border-2 border-green-500/30 hover:border-green-500/60'
            }`}
          >
            <span className="text-3xl mb-1">YES</span>
            <span className="text-sm font-normal opacity-80">They tipped</span>
          </button>
          <button
            type="button"
            onClick={() => setTipped(false)}
            className={`flex flex-col items-center justify-center rounded-2xl min-h-[88px] text-xl font-bold transition-all ${
              tipped === false
                ? 'bg-red-500 text-white ring-2 ring-red-300 scale-[1.02]'
                : 'bg-gray-800 text-red-400 border-2 border-red-500/30 hover:border-red-500/60'
            }`}
          >
            <span className="text-3xl mb-1">NO</span>
            <span className="text-sm font-normal opacity-80">No tip</span>
          </button>
        </div>
      </div>

      {tipped && (
        <Input
          label="Tip Amount (optional)"
          type="number"
          step="0.01"
          min="0.01"
          max="99.99"
          placeholder="0.00"
          value={tipAmount}
          onChange={(e) => setTipAmount(e.target.value)}
          error={errors.tipAmount}
          hint="Enter the tip amount in dollars"
        />
      )}

      <div>
        <p className="text-sm font-medium text-gray-300 mb-1">Location</p>

        {geoLoading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            {geoSource === 'zip' ? 'Looking up ZIP code...' : 'Getting GPS location...'}
          </div>
        )}

        {!geoLoading && lat != null && lng != null && (
          <div className="bg-gray-800 rounded-xl px-4 py-3 text-sm">
            <p className="text-green-400 font-medium">
              {geoSource === 'zip' ? `Using ZIP ${zip}` : 'Using GPS location'}
            </p>
            <p className="text-gray-400 mt-0.5">Location locked in</p>
            <button
              type="button"
              onClick={() => { setZipLookedUp(false); refresh(); }}
              className="text-xs text-gray-500 underline mt-1"
            >
              Retry GPS
            </button>
          </div>
        )}

        {!geoLoading && geoError && lat == null && (
          <div className="bg-gray-800 rounded-xl px-4 py-3 text-sm space-y-3">
            <div>
              <p className="text-yellow-400 font-medium">GPS unavailable — enter ZIP code</p>
              <p className="text-gray-500 text-xs mt-0.5">Used to place your pin on the earnings map.</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{5}"
                maxLength={5}
                placeholder="e.g. 90210"
                value={zip}
                onChange={(e) => { setZip(e.target.value.replace(/\D/g, '')); setZipLookedUp(false); }}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm min-h-[44px]"
              />
              <button
                type="button"
                disabled={zip.length !== 5 || geoLoading}
                onClick={async () => {
                  const ok = await resolveZip(zip);
                  setZipLookedUp(ok);
                  if (!ok) setErrors((e) => ({ ...e, location: 'ZIP not found — try another' }));
                  else setErrors((e) => { const n = { ...e }; delete n.location; return n; });
                }}
                className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium min-h-[44px] disabled:opacity-40 hover:bg-green-500 transition-colors whitespace-nowrap"
              >
                Use ZIP
              </button>
            </div>
          </div>
        )}

        {errors.location && <p className="text-xs text-red-400 mt-1">{errors.location}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-300" htmlFor="notes">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={140}
          rows={3}
          placeholder="e.g. apt complex, gated community (no names or addresses)"
          className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
        />
        <div className="flex justify-between mt-1">
          {errors.notes ? (
            <p className="text-xs text-red-400">{errors.notes}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-gray-500">{notes.length}/140</p>
        </div>
      </div>

      <Button size="lg" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Delivery'}
      </Button>
    </div>
  );
}
