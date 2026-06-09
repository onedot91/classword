import type { StudentNumber } from '../types/app';

type ParticipationPanelProps = {
  participantCount: number;
  missingStudents: StudentNumber[];
  completedCount: number;
};

export function ParticipationPanel({ participantCount, missingStudents, completedCount }: ParticipationPanelProps) {
  return (
    <section className="teacher-section participation-panel">
      <h2>참여 현황</h2>
      <div className="status-list">
        <div>
          <span>참여</span>
          <strong>{participantCount}/23</strong>
        </div>
        <div>
          <span>완료</span>
          <strong>{completedCount}/14</strong>
        </div>
      </div>
      <div className="missing-list" aria-label="미참여 학생">
        <span>미참여</span>
        <div>
          {missingStudents.length > 0
            ? missingStudents.map((student) => <span key={student}>{student}</span>)
            : <strong>없음</strong>}
        </div>
      </div>
    </section>
  );
}
