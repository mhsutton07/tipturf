'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, addLog as dbAddLog, deleteLog as dbDeleteLog, getStats } from '@/lib/db/local';
import type { TipLog, Stats } from '@/types';

export function useLocalLogs() {
  const [logs, setLogs] = useState<TipLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [allLogs, allStats] = await Promise.all([
      db.entries.orderBy('createdAt').reverse().toArray(),
      getStats(),
    ]);
    setLogs(allLogs);
    setStats(allStats);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();

    // Dexie event listeners for reactive updates
    function onCreating() { setTimeout(refresh, 50); }
    function onDeleting() { setTimeout(refresh, 50); }

    db.entries.hook('creating', onCreating);
    db.entries.hook('deleting', onDeleting);

    return () => {
      db.entries.hook('creating').unsubscribe(onCreating);
      db.entries.hook('deleting').unsubscribe(onDeleting);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addLog(log: Omit<TipLog, 'id' | 'createdAt'>): Promise<TipLog> {
    const result = await dbAddLog(log);
    await refresh();
    return result;
  }

  async function deleteLog(id: string): Promise<void> {
    await dbDeleteLog(id);
    await refresh();
  }

  return {
    logs,
    addLog,
    deleteLog,
    stats,
    isLoading,
  };
}
