import type { Round, TeacherActionResponse, TeacherSession } from '../types/app';
import { deleteLocalEntriesByDate, deleteLocalEntry, upsertLocalRound } from './localData';
import { enableLocalDataFallback, isSupabaseConfigured, shouldUseLocalData, supabase } from './supabase';

const TEACHER_TOKEN_KEY = 'classword_teacher_token';

function createLocalTeacherSession(): TeacherActionResponse<TeacherSession> {
  return {
    data: {
      token: `local-${Date.now()}`,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    },
  };
}

function isFunctionMissingMessage(message: string): boolean {
  return message.includes('Requested function was not found') || message.includes('Failed to send a request to the Edge Function');
}

function shouldFallbackToLocalData(error: string): boolean {
  return !isSupabaseConfigured && isFunctionMissingMessage(error);
}

function getBackendRequiredError(error: string): string {
  return `${error} 교사용 기능을 공유하려면 Supabase Edge Function을 배포해야 합니다.`;
}

async function getFunctionErrorMessage(error: unknown): Promise<string> {
  const context = (error as { context?: unknown }).context;
  if (context instanceof Response) {
    try {
      const body = (await context.json()) as { error?: string };
      if (body.error) {
        return body.error;
      }
    } catch {
      // Fall back to the client error message below.
    }
  }

  return error instanceof Error ? error.message : '요청을 처리할 수 없습니다.';
}

async function callTeacherAction<T>(action: string, payload: Record<string, unknown>): Promise<TeacherActionResponse<T>> {
  const { data, error } = await supabase.functions.invoke<TeacherActionResponse<T>>('teacher-actions', {
    body: { action, ...payload },
  });

  if (error) {
    return { error: await getFunctionErrorMessage(error) };
  }

  return data ?? { error: '응답이 없습니다.' };
}

export function getTeacherToken(): string | null {
  const token = localStorage.getItem(TEACHER_TOKEN_KEY);
  if (isSupabaseConfigured && token?.startsWith('local-')) {
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

  if (result.error && isFunctionMissingMessage(result.error)) {
    return { error: getBackendRequiredError(result.error) };
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

  if (result.error && isFunctionMissingMessage(result.error)) {
    return { error: getBackendRequiredError(result.error) };
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

  if (result.error && isFunctionMissingMessage(result.error)) {
    return { error: getBackendRequiredError(result.error) };
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

  if (result.error && isFunctionMissingMessage(result.error)) {
    return { error: getBackendRequiredError(result.error) };
  }

  return result;
}
