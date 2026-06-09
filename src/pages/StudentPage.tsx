import { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ConfettiComplete } from '../components/ConfettiComplete';
import { InitialGrid } from '../components/InitialGrid';
import { StudentBadge } from '../components/StudentBadge';
import { getTodayDateKey } from '../lib/date';
import { INITIALS } from '../lib/initials';
import { getLocalEntries, getLocalRound, insertLocalEntry, updateLocalEntry } from '../lib/localData';
import { useRealtimeBoard } from '../lib/realtime';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
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
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchBoard = useCallback(async () => {
    setLoadError('');

    if (!isSupabaseConfigured) {
      setRound(getLocalRound(todayDate));
      setEntries(getLocalEntries(todayDate));
      setIsLoading(false);
      return;
    }

    const [roundResult, entriesResult] = await Promise.all([
      supabase.from('rounds').select('*').eq('round_date', todayDate).maybeSingle(),
      supabase.from('entries').select('*').eq('round_date', todayDate).order('created_at', { ascending: true }),
    ]);

    if (roundResult.error) {
      setLoadError(roundResult.error.message);
    } else {
      setRound(roundResult.data as Round | null);
    }

    if (entriesResult.error) {
      setLoadError(entriesResult.error.message);
    } else {
      setEntries((entriesResult.data ?? []) as Entry[]);
    }

    setIsLoading(false);
  }, [todayDate]);

  useEffect(() => {
    void fetchBoard();
  }, [fetchBoard]);

  useRealtimeBoard({ date: todayDate, onChange: fetchBoard });

  const submittedEntry = entries.find((entry) => entry.student_number === studentNumber);
  const completedCount = entries.length;
  const complete = completedCount === INITIALS.length;

  function handleSelectInitial(initial: Initial) {
    const selectedEntry = entries.find((entry) => entry.initial === initial);
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
    setPendingWord(draftWord.trim());
  }

  async function submitWord(initial: Initial, input: string): Promise<string | null> {
    if (!initial) {
      return '초성을 골라 주세요.';
    }

    if (entries.some((entry) => entry.initial === initial && entry.id !== submittedEntry?.id)) {
      return '이미 채워진 칸이에요.';
    }

    const validation = validateWord(input, initial);
    if (!validation.ok) {
      return validation.message;
    }

    if (!isSupabaseConfigured) {
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

    const { error } = submittedEntry
      ? await supabase
          .from('entries')
          .update({
            initial,
            word: validation.word,
          })
          .eq('id', submittedEntry.id)
      : await supabase.from('entries').insert({
          round_date: todayDate,
          initial,
          word: validation.word,
          student_number: studentNumber,
        });

    if (error) {
      if (error.code === '23505') {
        return submittedEntry ? '이미 채워진 칸이에요.' : '오늘은 한 번만 제출할 수 있어요.';
      }
      return error.message;
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
      setSubmitMessage(error);
      setPendingWord('');
      return;
    }

    setDraftWord('');
    setPendingWord('');
  }

  return (
    <main className="app-shell student-shell">
      <header className="app-header">
        <div>
          <div className="student-header-badge">
            <StudentBadge studentNumber={studentNumber} />
          </div>
          <h1 className="topic-sentence">
            오늘의 주제는 <span className="topic-word">{round?.topic || '미정'}</span> 입니다.
          </h1>
        </div>
        <button type="button" className="secondary-button" onClick={onChangeNumber}>
          <RotateCcw size={18} />
          번호 변경
        </button>
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
          }}
          onSelect={handleSelectInitial}
        />
      </section>
    </main>
  );
}
