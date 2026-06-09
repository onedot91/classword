import type { UserNumber } from '../types/app';

type NumberSelectProps = {
  onSelectNumber: (number: UserNumber) => void;
};

export function NumberSelect({ onSelectNumber }: NumberSelectProps) {
  return (
    <div className="number-grid" aria-label="번호 선택">
      {Array.from({ length: 24 }, (_, number) => (
        <button key={number} type="button" className={number === 0 ? 'number-button teacher' : 'number-button'} onClick={() => onSelectNumber(number as UserNumber)}>
          {number}
        </button>
      ))}
    </div>
  );
}
