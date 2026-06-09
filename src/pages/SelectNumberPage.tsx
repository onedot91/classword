import { NumberSelect } from '../components/NumberSelect';
import type { UserNumber } from '../types/app';

type SelectNumberPageProps = {
  onSelectNumber: (number: UserNumber) => void;
};

export function SelectNumberPage({ onSelectNumber }: SelectNumberPageProps) {
  return (
    <main className="center-page">
      <section className="select-panel">
        <div className="page-kicker">초성 낱말판</div>
        <h1>몇 번?</h1>
        <NumberSelect onSelectNumber={onSelectNumber} />
      </section>
    </main>
  );
}
