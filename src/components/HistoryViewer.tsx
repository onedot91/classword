import type { Entry, Round } from '../types/app';
import { INITIALS } from '../lib/initials';

type HistoryViewerProps = {
  selectedDate: string;
  round: Round | null;
  entries: Entry[];
  onDateChange: (date: string) => void;
};

export function HistoryViewer({ selectedDate, round, entries, onDateChange }: HistoryViewerProps) {
  const entriesByInitial = new Map(entries.map((entry) => [entry.initial, entry]));

  return (
    <section className="teacher-section history-viewer">
      <div className="section-title-row">
        <h2>날짜별 기록</h2>
        <input type="date" value={selectedDate} onChange={(event) => onDateChange(event.target.value)} />
      </div>
      <p className="history-topic">주제: {round?.topic || '아직 없음'}</p>
      <div className="history-list">
        {INITIALS.map((initial) => {
          const entry = entriesByInitial.get(initial);
          return (
            <div key={initial} className={entry ? 'history-row filled' : 'history-row'}>
              <strong>{initial}</strong>
              <span>{entry ? entry.word : '-'}</span>
              <em>{entry ? `${entry.student_number}번` : ''}</em>
            </div>
          );
        })}
      </div>
    </section>
  );
}
