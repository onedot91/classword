import confetti from 'canvas-confetti';
import { useEffect, useRef } from 'react';
import { playSound } from '../lib/sound';

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
    playSound('complete');

    const colors = ['#d9f06f', '#bde8ff', '#ffd1dc', '#bfa7ff', '#ffd666', '#ffbe9f'];
    const timers = [
      window.setTimeout(() => {
        void confetti({
          particleCount: 110,
          spread: 92,
          startVelocity: 46,
          origin: { x: 0.5, y: 0.62 },
          colors,
          scalar: 1.08,
          ticks: 220,
          disableForReducedMotion: true,
        });
      }, 0),
      window.setTimeout(() => {
        void confetti({
          particleCount: 90,
          angle: 58,
          spread: 64,
          startVelocity: 58,
          origin: { x: 0.05, y: 0.88 },
          colors,
          scalar: 1.18,
          ticks: 260,
          disableForReducedMotion: true,
        });
        void confetti({
          particleCount: 90,
          angle: 122,
          spread: 64,
          startVelocity: 58,
          origin: { x: 0.95, y: 0.88 },
          colors,
          scalar: 1.18,
          ticks: 260,
          disableForReducedMotion: true,
        });
      }, 180),
      window.setTimeout(() => {
        void confetti({
          particleCount: 70,
          spread: 110,
          startVelocity: 34,
          origin: { x: 0.5, y: 0.35 },
          colors,
          scalar: 0.86,
          ticks: 180,
          disableForReducedMotion: true,
        });
      }, 440),
      window.setTimeout(() => {
        void confetti({
          particleCount: 120,
          angle: 90,
          spread: 150,
          startVelocity: 42,
          origin: { x: 0.5, y: 0.72 },
          colors,
          scalar: 0.92,
          ticks: 240,
          disableForReducedMotion: true,
        });
      }, 780),
    ];

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [complete]);

  if (!complete) {
    return null;
  }

  return (
    <div className="complete-banner" aria-label="완성!">
      <span style={{ animationDelay: '80ms' }}>완</span>
      <span style={{ animationDelay: '170ms' }}>성</span>
      <span style={{ animationDelay: '260ms' }}>!</span>
    </div>
  );
}
