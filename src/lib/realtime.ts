import { useEffect } from 'react';
import { LOCAL_BOARD_EVENT } from './localData';
import { shouldUseLocalData } from './backend';

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

    if (!shouldUseLocalData()) {
      onChange();
    }

    return () => {
      window.removeEventListener(LOCAL_BOARD_EVENT, onChange);
      window.removeEventListener('focus', onChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(syncIntervalId);
    };
  }, [date, onChange]);
}
