'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';
import { publicEnv } from '@/lib/env';

let browserClient: SupabaseClient | null = null;

/** Client Supabase navigateur (cle anonyme), ou null si non configure. */
export function getRealtimeClient(): SupabaseClient | null {
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  if (!browserClient) {
    browserClient = createClient(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 5 } } },
    );
  }
  return browserClient;
}

type TableName = 'Bid' | 'Message' | 'Notification';

interface UseRealtimeOptions {
  table: TableName;
  /** Filtre PostgREST, ex. `project_id=eq.<id>`. */
  filter?: string;
  onChange: () => void;
  /** Intervalle de repli (ms) lorsque Realtime n'est pas disponible. */
  pollIntervalMs?: number;
  enabled?: boolean;
}

/**
 * S'abonne aux changements d'une table via Supabase Realtime.
 * Si Realtime n'est pas configure, bascule automatiquement sur un
 * rafraichissement periodique afin que l'interface reste a jour.
 */
export function useRealtime({
  table,
  filter,
  onChange,
  pollIntervalMs = 15_000,
  enabled = true,
}: UseRealtimeOptions): void {
  const handlerRef = useRef(onChange);
  handlerRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;

    const client = getRealtimeClient();

    if (!client) {
      const timer = setInterval(() => handlerRef.current(), pollIntervalMs);
      return () => clearInterval(timer);
    }

    const channel = client
      .channel(`realtime:${table}:${filter ?? 'all'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
        () => handlerRef.current(),
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [table, filter, pollIntervalMs, enabled]);
}
