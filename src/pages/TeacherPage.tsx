import { useCallback, useEffect, useMemo, useState } from 'react';
import { TeacherDashboard } from '../components/TeacherDashboard';
import { TeacherLogin } from '../components/TeacherLogin';
import { getTodayDateKey } from '../lib/date';
import { deleteLocalEntry, getLocalEntries, getLocalRound, upsertLocalRound } from '../lib/localData';
import { useRealtimeBoard } from '../lib/realtime';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { clearTeacherToken, deleteEntry, getTeacherToken, loginTeacher, saveTeacherToken, updateTopic } from '../lib/teacherApi';
import type { Entry, Round } from '../types/app';

type TeacherPageProps = {
  onChangeNumber: () => void;
};

export function TeacherPage({ onChangeNumber }: TeacherPageProps) {
  const todayDate = useMemo(() => getTodayDateKey(), []);
  const [token, setToken] = useState<string | null>(() => getTeacherToken());
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [round, setRound] = useState<Round | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadError, setLoadError] = useState('');

  const fetchBoard = useCallback(async () => {
    setLoadError('');

    if (!isSupabaseConfigured) {
      setRound(getLocalRound(selectedDate));
      setEntries(getLocalEntries(selectedDate));
      return;
    }

    const [roundResult, entriesResult] = await Promise.all([
      supabase.from('rounds').select('*').eq('round_date', selectedDate).maybeSingle(),
      supabase.from('entries').select('*').eq('round_date', selectedDate).order('created_at', { ascending: true }),
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
  }, [selectedDate]);

  useEffect(() => {
    if (token) {
      void fetchBoard();
    }
  }, [fetchBoard, token]);

  useRealtimeBoard({ date: selectedDate, onChange: fetchBoard });

  async function handleLogin(password: string): Promise<string | null> {
    const result = await loginTeacher(password);
    if (result.error || !result.data) {
      return result.error ?? '로그인할 수 없습니다.';
    }

    saveTeacherToken(result.data.token);
    setToken(result.data.token);
    return null;
  }

  function handleLogout() {
    clearTeacherToken();
    setToken(null);
    onChangeNumber();
  }

  async function handleTopicSave(topic: string): Promise<string | null> {
    if (!token) {
      return '다시 로그인해 주세요.';
    }

    if (!isSupabaseConfigured) {
      upsertLocalRound(todayDate, topic);
      await fetchBoard();
      return null;
    }

    const result = await updateTopic(token, todayDate, topic);
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

    if (!isSupabaseConfigured) {
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

  if (!token) {
    return <TeacherLogin onLogin={handleLogin} onBack={onChangeNumber} />;
  }

  return (
    <>
      {loadError ? <p className="global-error">{loadError}</p> : null}
      <TeacherDashboard
        selectedDate={selectedDate}
        todayDate={todayDate}
        round={round}
        entries={entries}
        completedCount={entries.length}
        onDateChange={setSelectedDate}
        onTopicSave={handleTopicSave}
        onDeleteEntry={handleDeleteEntry}
        onLogout={handleLogout}
      />
    </>
  );
}
