import { NumberSelect } from '../components/NumberSelect';
import type { UserNumber } from '../types/app';

type SelectNumberPageProps = {
  onSelectNumber: (number: UserNumber) => void;
};

export function SelectNumberPage({ onSelectNumber }: SelectNumberPageProps) {
  return (
    <main className="center-page">
      <section className="select-panel">
        <h1>몇 번?</h1>
        <NumberSelect onSelectNumber={onSelectNumber} />
      </section>
    </main>
  );
}
