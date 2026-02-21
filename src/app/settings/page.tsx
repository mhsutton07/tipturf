'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useLocalLogs } from '@/hooks/useLocalLogs';
import { useToast } from '@/components/ui/Toast';
import { db } from '@/lib/db/local';
import { useSubscription } from '@/hooks/useSubscription';

export default function SettingsPage() {
  const { logs } = useLocalLogs();
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [communityShare, setCommunityShare] = useState(true);
  const [communityView, setCommunityView] = useState(false);
  const [showShareOffConfirm, setShowShareOffConfirm] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('tipturf_community_share');
    if (stored !== null) {
      setCommunityShare(stored === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tipturf_community_share', String(communityShare));
  }, [communityShare]);

  const { isPro, loading: subLoading } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      toast('Could not open billing portal. Please try again.', 'error');
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleUpgrade() {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      toast('Could not start checkout. Please try again.', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleShareToggle() {
    if (communityShare) {
      setShowShareOffConfirm(true);
    } else {
      setCommunityShare(true);
      try {
        const res = await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logs),
        });
        if (!res.ok) throw new Error('sync failed');
        toast('Your logs are now shared with the community.', 'success');
      } catch {
        toast('Could not sync logs. Try again later.', 'error');
        setCommunityShare(false);
      }
    }
  }

  async function handleDeleteAll() {
    await db.entries.clear();
    toast('All local data deleted.', 'success');
    setShowConfirm(false);
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <TopBar title="Settings" />
      <div className="pt-14 px-4 pb-8 flex flex-col gap-6 mt-4">

        {/* Community */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">Community Map</h2>
          <p className="text-xs text-gray-500 mb-4">
            Your data stays on your device until you share it.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Share my logs</p>
                <p className="text-xs text-gray-500">Add your data to the community map and see what others are earning</p>
              </div>
              <button
                onClick={handleShareToggle}
                className={`w-12 h-6 rounded-full transition-colors ${
                  communityShare ? 'bg-green-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`block w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${
                    communityShare ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Show community data</p>
                <p className="text-xs text-gray-500">Overlay aggregate tip rates from all drivers</p>
              </div>
              <button
                onClick={() => setCommunityView(!communityView)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  communityView ? 'bg-green-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`block w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${
                    communityView ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">Subscription</h2>
          {subLoading ? (
            <p className="text-xs text-gray-500">Loading…</p>
          ) : isPro ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">Plan:</span>
                <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                  Pro Member
                </span>
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? 'Opening portal…' : 'Manage Subscription'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">Plan:</span>
                <span className="text-xs text-gray-400">Free Plan</span>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleUpgrade}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? 'Redirecting…' : 'Upgrade to Pro · $6.99/mo'}
              </Button>
            </div>
          )}
        </div>

        {/* Data */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">Your Data</h2>
          <p className="text-xs text-gray-500 mb-4">
            {logs.length} deliveries stored locally on this device.
            Data never leaves your device without your consent.
          </p>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-sm text-red-400 hover:text-red-300 transition-colors min-h-[44px]"
            >
              Delete all local data
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-red-400 font-medium">
                This will permanently delete all {logs.length} deliveries. Are you sure?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => setShowConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteAll}>
                  Delete All
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* About */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-2">About TipTurf</h2>
          <div className="flex flex-col gap-2 text-xs text-gray-500">
            <p>Know before you go.</p>
            <p>TipTurf shows gig drivers where tips are highest, broken down by neighborhood and time of day.</p>
          </div>
        </div>

        {/* Install as PWA */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-2">Install on Phone</h2>
          <div className="flex flex-col gap-2 text-xs text-gray-500">
            <p><span className="text-white font-medium">iOS:</span> Tap Share → Add to Home Screen</p>
            <p><span className="text-white font-medium">Android:</span> Tap menu → Add to Home Screen / Install App</p>
          </div>
        </div>

      </div>

      <Modal
        open={showShareOffConfirm}
        onClose={() => setShowShareOffConfirm(false)}
        title="Stop sharing your logs?"
      >
        <p className="text-sm text-gray-400 mb-6">
          Your past contributions stay on the map, but new logs won&apos;t be added.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowShareOffConfirm(false)}
          >
            Keep sharing
          </Button>
          <Button
            variant="danger"
            size="lg"
            onClick={() => {
              setCommunityShare(false);
              setShowShareOffConfirm(false);
            }}
          >
            Stop sharing
          </Button>
        </div>
      </Modal>
    </div>
  );
}
