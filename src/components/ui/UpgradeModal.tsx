'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface UpgradeModalProps {
  onDismiss: () => void;
}

export function UpgradeModal({ onDismiss }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <Modal open={true} onClose={onDismiss} title="Unlock the Community Heatmap">
      <p className="text-sm text-gray-400 mb-6">
        See where thousands of drivers earn the most — updated live. $6.99/mo, cancel anytime.
      </p>
      <div className="flex flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading ? 'Redirecting…' : 'Upgrade to Pro'}
        </Button>
        <button
          onClick={onDismiss}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors py-2"
        >
          Stay on free plan
        </button>
      </div>
    </Modal>
  );
}
