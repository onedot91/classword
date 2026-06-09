import { useEffect, useState } from 'react';
import { playSound } from '../lib/sound';
import type { UserNumber } from '../types/app';

type NumberSelectProps = {
  onSelectNumber: (number: UserNumber) => void;
};

export function NumberSelect({ onSelectNumber }: NumberSelectProps) {
  const [teacherClickCount, setTeacherClickCount] = useState(0);
  const [pendingNumber, setPendingNumber] = useState<UserNumber | null>(null);
  const showTeacherNumber = teacherClickCount >= 5;
  const numbers = showTeacherNumber ? Array.from({ length: 24 }, (_, number) => number) : Array.from({ length: 23 }, (_, index) => index + 1);

  useEffect(() => {
    if (pendingNumber === null) {
      return undefined;
    }

    function handleWindowKeyDown(event: KeyboardEvent) {
      if (event.repeat || pendingNumber === null) {
        return;
      }

      if (event.target instanceof HTMLElement && event.target.closest('button')) {
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        playSound('success');
        onSelectNumber(pendingNumber);
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        playSound('select');
        setPendingNumber(null);
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [onSelectNumber, pendingNumber]);

  return (
    <>
      {!showTeacherNumber ? (
        <button
          type="button"
          className="teacher-number-trigger"
          aria-label="0번 표시"
          onClick={() => {
            playSound('select');
            setTeacherClickCount((count) => count + 1);
          }}
        />
      ) : null}
      <div className="number-grid" aria-label="번호 선택">
        {numbers.map((number) => (
          <button
            key={number}
            type="button"
            className={number === 0 ? 'number-button teacher' : 'number-button'}
            onClick={() => {
              playSound('open');
              setPendingNumber(number as UserNumber);
            }}
          >
            {number}
          </button>
        ))}
      </div>
      {pendingNumber !== null ? (
        <div className="number-confirm-backdrop" role="presentation">
          <div className="number-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="number-confirm-title">
            <strong id="number-confirm-title">{pendingNumber}번 맞나요?</strong>
            <span>이 번호로 들어갈게요.</span>
            <div className="number-confirm-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  playSound('select');
                  setPendingNumber(null);
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('success');
                  onSelectNumber(pendingNumber);
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
