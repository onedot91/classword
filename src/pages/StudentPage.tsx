import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfettiComplete } from '../components/ConfettiComplete';
import { GomaNotifier } from '../components/GomaNotifier';
import { InitialGrid } from '../components/InitialGrid';
import { StudentBadge } from '../components/StudentBadge';
import { getTodayDateKey } from '../lib/date';
import { INITIALS } from '../lib/initials';
import { deleteLocalEntry, getLocalEntries, getLocalRound, insertLocalEntry, updateLocalEntry } from '../lib/localData';
import { useRealtimeBoard } from '../lib/realtime';
import { playSound } from '../lib/sound';
import { deleteStudentEntry, submitStudentEntry } from '../lib/studentApi';
import { getBoard, shouldUseLocalData } from '../lib/backend';
import { validateWord } from '../lib/validation';
import type { Entry, Initial, Round, StudentNumber } from '../types/app';

type StudentPageProps = {
  studentNumber: StudentNumber;
  onChangeNumber: () => void;
};

export function StudentPage({ studentNumber, onChangeNumber }: StudentPageProps) {
  const todayDate = useMemo(() => getTodayDateKey(), []);
  const [round, setRound] = useState<Round | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedInitial, setSelectedInitial] = useState<Initial | null>(null);
  const [draftWord, setDraftWord] = useState('');
  const [pendingWord, setPendingWord] = useState('');
  const [celebrationInitial, setCelebrationInitial] = useState<Initial | null>(null);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchBoard = useCallback(async () => {
    setLoadError('');

    if (shouldUseLocalData()) {
      setRound(getLocalRound(todayDate));
      setEntries(getLocalEntries(todayDate));
      setIsLoading(false);
      return;
    }

    const result = await getBoard(todayDate);
    if (result.error || !result.data) {
      setLoadError(result.error ?? '학급 낱말판을 불러올 수 없습니다.');
      setIsLoading(false);
      return;
    }

    setRound(result.data.round);
    setEntries([...result.data.entries]);
    setIsLoading(false);
  }, [todayDate]);

  useEffect(() => {
    void fetchBoard();
  }, [fetchBoard]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isChangeNumberShortcut = event.altKey && (event.ctrlKey || event.metaKey);

      if (event.key !== 'Enter' || !isChangeNumberShortcut || event.repeat) {
        return;
      }

      event.preventDefault();
      onChangeNumber();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onChangeNumber]);

  useRealtimeBoard({ date: todayDate, onChange: fetchBoard });

  useEffect(() => {
    if (!celebrationInitial) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setCelebrationInitial(null), 900);
    return () => window.clearTimeout(timeout);
  }, [celebrationInitial]);

  const submittedEntry = entries.find((entry) => entry.student_number === studentNumber);
  const completedCount = entries.length;
  const remainingCount = Math.max(INITIALS.length - completedCount, 0);
  const complete = completedCount === INITIALS.length;

  function handleSelectInitial(initial: Initial) {
    const selectedEntry = entries.find((entry) => entry.initial === initial);
    playSound(selectedEntry && selectedEntry.id === submittedEntry?.id ? 'open' : 'select');
    setSelectedInitial(initial);
    setPendingWord('');
    setSubmitMessage('');
    setDraftWord(selectedEntry && selectedEntry.id === submittedEntry?.id ? selectedEntry.word : '');
  }

  function handleRequestSubmit() {
    if (!selectedInitial || !draftWord.trim()) {
      return;
    }

    setSubmitMessage('');
    playSound('confirm');
    setPendingWord(draftWord.trim());
  }

  function handleCancelSelection() {
    setSelectedInitial(null);
    setDraftWord('');
    setPendingWord('');
    setSubmitMessage('');
  }

  async function submitWord(initial: Initial, input: string): Promise<string | null> {
    if (!initial) {
      return '초성을 골라 주세요.';
    }

    if (entries.some((entry) => entry.initial === initial && entry.id !== submittedEntry?.id)) {
      return '이미 채워진 칸이에요.';
    }

    const validation = validateWord(input, initial, round?.topic);
    if (!validation.ok) {
      return validation.message;
    }

    if (shouldUseLocalData()) {
      try {
        if (submittedEntry) {
          updateLocalEntry(submittedEntry.id, initial, validation.word);
        } else {
          insertLocalEntry(todayDate, initial, validation.word, studentNumber);
        }
      } catch (error) {
        return error instanceof Error ? error.message : '제출할 수 없어요.';
      }

      setSelectedInitial(null);
      await fetchBoard();
      return null;
    }

    const result = await submitStudentEntry(todayDate, initial, validation.word, studentNumber, submittedEntry?.id);
    if (result.error) {
      return result.error;
    }

    setSelectedInitial(null);
    await fetchBoard();
    return null;
  }

  async function handleConfirmSubmit() {
    if (!selectedInitial || !pendingWord) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');
    const error = await submitWord(selectedInitial, pendingWord);
    setIsSubmitting(false);

    if (error) {
      playSound('error');
      setSubmitMessage(error);
      setPendingWord('');
      return;
    }

    playSound('success');
    setCelebrationInitial(selectedInitial);
    setDraftWord('');
    setPendingWord('');
  }

  async function handleDeleteSubmittedEntry() {
    if (!submittedEntry || !window.confirm('삭제할까요?')) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    if (shouldUseLocalData()) {
      deleteLocalEntry(submittedEntry.id);
      setSelectedInitial(null);
      setDraftWord('');
      setPendingWord('');
      setIsSubmitting(false);
      await fetchBoard();
      return;
    }

    const result = await deleteStudentEntry(submittedEntry.id, studentNumber);
    setIsSubmitting(false);

    if (result.error) {
      setSubmitMessage(result.error);
      return;
    }

    setSelectedInitial(null);
    setDraftWord('');
    setPendingWord('');
    await fetchBoard();
  }

  return (
    <main className="app-shell student-shell">
      <header className="app-header">
        <div>
          <div className="student-header-meta">
            <StudentBadge studentNumber={studentNumber} />
          </div>
          <h1 className="topic-sentence">
            오늘의 주제는 <span className="topic-word">{round?.topic || '미정'}</span> 입니다.
          </h1>
        </div>
      </header>

      <ConfettiComplete complete={complete} />

      {isLoading ? <p className="status-message">불러오는 중...</p> : null}
      {loadError ? <p className="error-message">{loadError}</p> : null}

      <section className="board-panel">
        <InitialGrid
          entries={entries}
          selectedInitial={selectedInitial}
          editableEntryId={submittedEntry?.id}
          inlineEditor={{
            word: draftWord,
            pendingWord,
            message: submitMessage,
            submitLabel: submittedEntry ? '수정' : '제출',
            isSubmitting,
            onWordChange: setDraftWord,
            onSubmit: handleRequestSubmit,
            onConfirm: handleConfirmSubmit,
            onCancelConfirm: () => setPendingWord(''),
            onCancel: handleCancelSelection,
          }}
          celebrationInitial={celebrationInitial}
          onSelect={handleSelectInitial}
          onDelete={submittedEntry ? handleDeleteSubmittedEntry : undefined}
        />
      </section>

      <GomaNotifier
        remainingCount={remainingCount}
        selectedInitial={selectedInitial}
        submittedEntry={submittedEntry}
        submitMessage={submitMessage}
        isLoading={isLoading}
        loadError={loadError}
        complete={complete}
      />
    </main>
  );
}
