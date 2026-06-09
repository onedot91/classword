import confetti from 'canvas-confetti';
import { useEffect, useRef } from 'react';

type ConfettiCompleteProps = {
  complete: boolean;
};

export function ConfettiComplete({ complete }: ConfettiCompleteProps) {
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (!complete || hasPlayedRef.current) {
      return;
    }

    hasPlayedRef.current = true;
    void confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.65 },
      ticks: 170,
    });
  }, [complete]);

  if (!complete) {
    return null;
  }

  return <div className="complete-banner">완성!</div>;
}
