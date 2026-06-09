import { useEffect } from 'react';
import { LOCAL_BOARD_EVENT } from './localData';
import { isSupabaseConfigured, supabase } from './supabase';

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

    if (!isSupabaseConfigured) {
      return () => {
        window.removeEventListener(LOCAL_BOARD_EVENT, onChange);
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
      supabase.removeChannel(channel);
    };
  }, [date, onChange]);
}
