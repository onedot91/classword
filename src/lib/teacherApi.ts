import type { Round, TeacherActionResponse, TeacherSession, WordQuiz } from '../types/app';
import { deleteLocalEntriesByDate, deleteLocalEntry, upsertLocalRound, upsertLocalWordQuiz } from './localData';
import { enableLocalDataFallback, isApiMissingMessage, isRemoteBackendConfigured, postAction, shouldUseLocalData } from './backend';

const TEACHER_TOKEN_KEY = 'classword_teacher_token';
const UUID_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createLocalTeacherSession(): TeacherActionResponse<TeacherSession> {
  return {
    data: {
      token: `${isRemoteBackendConfigured ? 'shared' : 'local'}-${Date.now()}`,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    },
  };
}

function shouldFallbackToLocalData(error: string): boolean {
  return !isRemoteBackendConfigured && isApiMissingMessage(error);
}

async function callTeacherAction<T>(action: string, payload: Record<string, unknown>): Promise<TeacherActionResponse<T>> {
  return postAction<T>('/api/teacher-actions', { action, ...payload });
}

export function getTeacherToken(): string | null {
  const token = localStorage.getItem(TEACHER_TOKEN_KEY);
  if (isRemoteBackendConfigured && token && !UUID_TOKEN_PATTERN.test(token)) {
    localStorage.removeItem(TEACHER_TOKEN_KEY);
    return null;
  }

  return token;
}

export function saveTeacherToken(token: string): void {
  localStorage.setItem(TEACHER_TOKEN_KEY, token);
}

export function clearTeacherToken(): void {
  localStorage.removeItem(TEACHER_TOKEN_KEY);
}

export async function loginTeacher(): Promise<TeacherActionResponse<TeacherSession>> {
  if (shouldUseLocalData()) {
    return createLocalTeacherSession();
  }

  const result = await callTeacherAction<TeacherSession>('login', {});
  if (result.error && shouldFallbackToLocalData(result.error)) {
    enableLocalDataFallback();
    return createLocalTeacherSession();
  }

  return result;
}

export async function updateTopic(token: string, date: string, topic: string): Promise<TeacherActionResponse<Round>> {
  if (shouldUseLocalData()) {
    return { data: upsertLocalRound(date, topic) };
  }

  const result = await callTeacherAction<Round>('updateTopic', { token, date, topic });
  if (result.error && shouldFallbackToLocalData(result.error)) {
    enableLocalDataFallback();
    return { data: upsertLocalRound(date, topic) };
  }

  return result;
}

export async function updateWordQuiz(
  token: string,
  date: string,
  answer: string,
  meaning: string,
  exampleSentence: string,
): Promise<TeacherActionResponse<WordQuiz>> {
  if (shouldUseLocalData()) {
    return { data: upsertLocalWordQuiz(date, answer, meaning, exampleSentence) };
  }

  const result = await callTeacherAction<WordQuiz>('updateWordQuiz', { token, date, answer, meaning, exampleSentence });
  if (result.error && shouldFallbackToLocalData(result.error)) {
    enableLocalDataFallback();
    return { data: upsertLocalWordQuiz(date, answer, meaning, exampleSentence) };
  }

  return result;
}

export async function deleteEntry(token: string, entryId: string): Promise<TeacherActionResponse<{ id: string }>> {
  if (shouldUseLocalData()) {
    deleteLocalEntry(entryId);
    return { data: { id: entryId } };
  }

  const result = await callTeacherAction<{ id: string }>('deleteEntry', { token, entryId });
  if (result.error && shouldFallbackToLocalData(result.error)) {
    enableLocalDataFallback();
    deleteLocalEntry(entryId);
    return { data: { id: entryId } };
  }

  return result;
}

export async function deleteEntriesByDate(token: string, date: string): Promise<TeacherActionResponse<{ date: string }>> {
  if (shouldUseLocalData()) {
    deleteLocalEntriesByDate(date);
    return { data: { date } };
  }

  const result = await callTeacherAction<{ date: string }>('deleteEntriesByDate', { token, date });
  if (result.error && shouldFallbackToLocalData(result.error)) {
    enableLocalDataFallback();
    deleteLocalEntriesByDate(date);
    return { data: { date } };
  }

  return result;
}
