'use client';

import { useState, type ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/ui/UpgradeModal';

interface ProGateProps {
  children: ReactNode;
}

export function ProGate({ children }: ProGateProps) {
  const { isPro, loading } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gray-600 border-t-green-500 animate-spin" />
      </div>
    );
  }

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full h-full">
      <div style={{ filter: 'blur(4px)', pointerEvents: 'none' }} aria-hidden="true">
        {children}
      </div>
      {!dismissed && (
        <UpgradeModal onDismiss={() => setDismissed(true)} />
      )}
    </div>
  );
}
