import { AlertTriangle, LogOut, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { INITIALS } from '../lib/initials';
import type { Entry, Round, WordQuiz } from '../types/app';
import { ConfettiComplete } from './ConfettiComplete';
import { InitialGrid } from './InitialGrid';
import { TopicDatePicker } from './TopicDatePicker';
import { TopicEditor } from './TopicEditor';
import { WordQuizEditor } from './WordQuizEditor';

type TeacherDashboardProps = {
  selectedDate: string;
  todayDate: string;
  round: Round | null;
  wordQuiz: WordQuiz | null;
  savedTopics: string[];
  topicDates: string[];
  entries: Entry[];
  completedCount: number;
  onDateChange: (date: string) => void;
  onTopicSave: (topic: string) => Promise<string | null>;
  onWordQuizSave: (answer: string, meaning: string, exampleSentence: string) => Promise<string | null>;
  onDeleteEntry: (entryId: string) => void;
  onDeleteAllEntries: () => void;
  onLogout: () => void;
};

export function TeacherDashboard({
  selectedDate,
  todayDate,
  round,
  wordQuiz,
  savedTopics,
  topicDates,
  entries,
  completedCount,
  onDateChange,
  onTopicSave,
  onWordQuizSave,
  onDeleteEntry,
  onDeleteAllEntries,
  onLogout,
}: TeacherDashboardProps) {
  const isToday = selectedDate === todayDate;
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<0 | 1 | 2>(0);
  const topicLabel = isToday ? '오늘의 주제' : `${selectedDate} 주제`;

  function closeDeleteConfirm() {
    setDeleteConfirmStep(0);
  }

  function handleFinalDeleteConfirm() {
    onDeleteAllEntries();
    closeDeleteConfirm();
  }

  return (
    <main className="app-shell teacher-shell">
      <header className="app-header">
        <div>
          <div className="teacher-header-meta">
            <div className="page-kicker">교사용</div>
            <TopicDatePicker selectedDate={selectedDate} todayDate={todayDate} topicDates={topicDates} onDateChange={onDateChange} />
          </div>
          <h1 className="topic-sentence">
            {topicLabel}는 <span className="topic-word">{round?.topic || '미정'}</span> 입니다.
          </h1>
        </div>
        <button type="button" className="secondary-button header-action" onClick={onLogout}>
          <LogOut size={18} />
          나가기
        </button>
      </header>

      <ConfettiComplete complete={completedCount === INITIALS.length} />

      <TopicEditor label={topicLabel} topic={round?.topic ?? ''} savedTopics={savedTopics} onSave={onTopicSave} />

      <div className="teacher-layout">
        <section className="board-panel teacher-board-panel">
          <div className="teacher-board-actions">
            <button type="button" className="secondary-button danger-button" onClick={() => setDeleteConfirmStep(1)} disabled={entries.length === 0}>
              <Trash2 size={18} />
              1~23번 일괄 삭제
            </button>
          </div>
          <InitialGrid entries={entries} teacherMode onDelete={onDeleteEntry} />
        </section>
      </div>

      <WordQuizEditor wordQuiz={wordQuiz} onSave={onWordQuizSave} />

      {deleteConfirmStep > 0 ? (
        <div className="delete-confirm-backdrop" role="presentation">
          <section className="delete-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
            <button type="button" className="delete-confirm-close" onClick={closeDeleteConfirm} aria-label="닫기">
              <X size={20} />
            </button>
            <div className="delete-confirm-icon" aria-hidden="true">
              <AlertTriangle size={28} />
            </div>
            <strong id="delete-confirm-title">{deleteConfirmStep === 1 ? '전체 제출을 삭제할까요?' : '정말 모두 삭제할까요?'}</strong>
            <p>
              {deleteConfirmStep === 1
                ? `${selectedDate}의 ${entries.length}개 제출이 삭제됩니다.`
                : '이 작업은 되돌릴 수 없어요. 한 번 더 확인해 주세요.'}
            </p>
            <div className="delete-confirm-actions">
              <button type="button" className="secondary-button" onClick={closeDeleteConfirm}>
                취소
              </button>
              {deleteConfirmStep === 1 ? (
                <button type="button" className="danger-button" onClick={() => setDeleteConfirmStep(2)}>
                  한 번 더 확인
                </button>
              ) : (
                <button type="button" className="danger-button strong-danger-button" onClick={handleFinalDeleteConfirm}>
                  모두 삭제
                </button>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
