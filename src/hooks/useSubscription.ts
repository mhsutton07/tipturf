'use client';

import { useEffect, useState } from 'react';

interface SubscriptionState {
  isPro: boolean;
  loading: boolean;
}

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({ isPro: false, loading: true });

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_BYPASS_PAYWALL === 'true') {
      setState({ isPro: true, loading: false });
      return;
    }

    fetch('/api/subscription/status')
      .then((res) => res.json())
      .then((data: { isPro: boolean }) => {
        setState({ isPro: data.isPro ?? false, loading: false });
      })
      .catch(() => {
        setState({ isPro: false, loading: false });
      });
  }, []);

  return state;
}
