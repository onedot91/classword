import { LogOut } from 'lucide-react';
import type { Entry, Round } from '../types/app';
import { ConfettiComplete } from './ConfettiComplete';
import { HistoryViewer } from './HistoryViewer';
import { InitialGrid } from './InitialGrid';
import { TopicEditor } from './TopicEditor';

type TeacherDashboardProps = {
  selectedDate: string;
  todayDate: string;
  round: Round | null;
  entries: Entry[];
  completedCount: number;
  onDateChange: (date: string) => void;
  onTopicSave: (topic: string) => Promise<string | null>;
  onDeleteEntry: (entryId: string) => void;
  onLogout: () => void;
};

export function TeacherDashboard({
  selectedDate,
  todayDate,
  round,
  entries,
  completedCount,
  onDateChange,
  onTopicSave,
  onDeleteEntry,
  onLogout,
}: TeacherDashboardProps) {
  const isToday = selectedDate === todayDate;

  return (
    <main className="app-shell teacher-shell">
      <header className="app-header">
        <div>
          <div className="page-kicker">교사용</div>
          <h1 className="topic-sentence">
            오늘의 주제는 <span className="topic-word">{round?.topic || '미정'}</span> 입니다.
          </h1>
        </div>
        <button type="button" className="secondary-button" onClick={onLogout}>
          <LogOut size={18} />
          나가기
        </button>
      </header>

      <ConfettiComplete complete={completedCount === 14} />

      {isToday ? <TopicEditor topic={round?.topic ?? ''} onSave={onTopicSave} /> : null}

      <div className="teacher-layout">
        <section className="board-panel teacher-board-panel">
          <InitialGrid entries={entries} teacherMode onDelete={onDeleteEntry} />
        </section>
        <section className="teacher-side">
          <HistoryViewer selectedDate={selectedDate} round={round} entries={entries} onDateChange={onDateChange} />
        </section>
      </div>
    </main>
  );
}
