import { useCallback, useEffect, useMemo, useState } from 'react';
import { TeacherDashboard } from '../components/TeacherDashboard';
import { getTodayDateKey } from '../lib/date';
import { deleteLocalEntriesByDate, deleteLocalEntry, getLocalEntries, getLocalRound, getLocalRounds, upsertLocalRound } from '../lib/localData';
import { useRealtimeBoard } from '../lib/realtime';
import { shouldUseLocalData, supabase } from '../lib/supabase';
import {
  clearTeacherToken,
  deleteEntriesByDate,
  deleteEntry,
  getTeacherToken,
  loginTeacher,
  saveTeacherToken,
  updateTopic,
} from '../lib/teacherApi';
import type { Entry, Round } from '../types/app';

type TeacherPageProps = {
  onChangeNumber: () => void;
};

export function TeacherPage({ onChangeNumber }: TeacherPageProps) {
  const todayDate = useMemo(() => getTodayDateKey(), []);
  const [token, setToken] = useState<string | null>(() => getTeacherToken());
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [round, setRound] = useState<Round | null>(null);
  const [savedTopics, setSavedTopics] = useState<string[]>([]);
  const [topicDates, setTopicDates] = useState<string[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadError, setLoadError] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [hasTriedSession, setHasTriedSession] = useState(false);

  const fetchBoard = useCallback(async () => {
    setLoadError('');

    if (shouldUseLocalData()) {
      const localRounds = getLocalRounds();
      setRound(getLocalRound(selectedDate));
      setSavedTopics(localRounds.map((localRound) => localRound.topic));
      setTopicDates(localRounds.filter((localRound) => localRound.topic.trim()).map((localRound) => localRound.round_date));
      setEntries(getLocalEntries(selectedDate));
      return;
    }

    const [roundResult, entriesResult, savedRoundsResult] = await Promise.all([
      supabase.from('rounds').select('*').eq('round_date', selectedDate).maybeSingle(),
      supabase.from('entries').select('*').eq('round_date', selectedDate).order('created_at', { ascending: true }),
      supabase.from('rounds').select('round_date, topic'),
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

    if (savedRoundsResult.error) {
      setLoadError(savedRoundsResult.error.message);
    } else {
      const savedRounds = savedRoundsResult.data ?? [];
      setSavedTopics(savedRounds.map((savedRound) => savedRound.topic));
      setTopicDates(savedRounds.filter((savedRound) => savedRound.topic.trim()).map((savedRound) => savedRound.round_date));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (token) {
      void fetchBoard();
    }
  }, [fetchBoard, token]);

  useEffect(() => {
    if (token || isCreatingSession || hasTriedSession) {
      return;
    }

    async function createSession() {
      setHasTriedSession(true);
      setIsCreatingSession(true);
      setLoadError('');
      const result = await loginTeacher();
      setIsCreatingSession(false);

      if (result.error || !result.data) {
        setLoadError(result.error ?? '교사용 화면으로 들어갈 수 없습니다.');
        return;
      }

      saveTeacherToken(result.data.token);
      setToken(result.data.token);
    }

    void createSession();
  }, [hasTriedSession, isCreatingSession, token]);

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

  useRealtimeBoard({ date: selectedDate, onChange: fetchBoard });

  function handleLogout() {
    clearTeacherToken();
    setToken(null);
    onChangeNumber();
  }

  async function handleTopicSave(topic: string): Promise<string | null> {
    if (!token) {
      return '다시 로그인해 주세요.';
    }

    if (shouldUseLocalData()) {
      upsertLocalRound(selectedDate, topic);
      await fetchBoard();
      return null;
    }

    const result = await updateTopic(token, selectedDate, topic);
    if (result.error) {
      return result.error;
    }

    await fetchBoard();
    return null;
  }

  async function handleDeleteEntry(entryId: string) {
    if (!token || !window.confirm('삭제할까요?')) {
      return;
    }

    if (shouldUseLocalData()) {
      deleteLocalEntry(entryId);
      await fetchBoard();
      return;
    }

    const result = await deleteEntry(token, entryId);
    if (result.error) {
      setLoadError(result.error);
      return;
    }

    await fetchBoard();
  }

  async function handleDeleteAllEntries() {
    if (!token || entries.length === 0) {
      return;
    }

    if (shouldUseLocalData()) {
      deleteLocalEntriesByDate(selectedDate);
      await fetchBoard();
      return;
    }

    const result = await deleteEntriesByDate(token, selectedDate);
    if (result.error) {
      setLoadError(result.error);
      return;
    }

    await fetchBoard();
  }

  if (!token) {
    return (
      <main className="center-page">
        <section className="login-panel">
          <div className="page-kicker">교사용</div>
          <h1>들어가는 중</h1>
          {loadError ? <p className="form-message">{loadError}</p> : <p className="form-message">교사용 화면을 준비하고 있어요.</p>}
          <button type="button" className="text-button" onClick={onChangeNumber}>
            번호 다시 선택
          </button>
        </section>
      </main>
    );
  }

  return (
    <>
      {loadError ? <p className="global-error">{loadError}</p> : null}
      <TeacherDashboard
        selectedDate={selectedDate}
        todayDate={todayDate}
        round={round}
        savedTopics={savedTopics}
        topicDates={topicDates}
        entries={entries}
        completedCount={entries.length}
        onDateChange={setSelectedDate}
        onTopicSave={handleTopicSave}
        onDeleteEntry={handleDeleteEntry}
        onDeleteAllEntries={handleDeleteAllEntries}
        onLogout={handleLogout}
      />
    </>
  );
}
