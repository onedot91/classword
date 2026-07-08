import { useEffect } from 'react';
import { LOCAL_BOARD_EVENT } from './localData';
import { shouldUseLocalData, supabase } from './supabase';

const BOARD_SYNC_INTERVAL_MS = 3000;

type RealtimeBoardOptions = {
  date: string;
  onChange: () => void;
};

export function useRealtimeBoard({ date, onChange }: RealtimeBoardOptions): void {
  useEffect(() => {
    if (!date) {
      return;
    }

    window.addEventListener(LOCAL_BOARD_EVENT, onChange);
    window.addEventListener('focus', onChange);

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        onChange();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const syncIntervalId = window.setInterval(onChange, BOARD_SYNC_INTERVAL_MS);

    if (shouldUseLocalData()) {
      return () => {
        window.removeEventListener(LOCAL_BOARD_EVENT, onChange);
        window.removeEventListener('focus', onChange);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.clearInterval(syncIntervalId);
      };
    }

    const channel = supabase
      .channel(`board-${date}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries', filter: `round_date=eq.${date}` },
        onChange,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rounds', filter: `round_date=eq.${date}` },
        onChange,
      )
      .subscribe();

    return () => {
      window.removeEventListener(LOCAL_BOARD_EVENT, onChange);
      window.removeEventListener('focus', onChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(syncIntervalId);
      supabase.removeChannel(channel);
    };
  }, [date, onChange]);
}
