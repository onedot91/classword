import type { Round, TeacherActionResponse, TeacherSession } from '../types/app';
import { isSupabaseConfigured, supabase } from './supabase';

const TEACHER_TOKEN_KEY = 'classword_teacher_token';

async function callTeacherAction<T>(action: string, payload: Record<string, unknown>): Promise<TeacherActionResponse<T>> {
  const { data, error } = await supabase.functions.invoke<TeacherActionResponse<T>>('teacher-actions', {
    body: { action, ...payload },
  });

  if (error) {
    return { error: error.message };
  }

  return data ?? { error: '응답이 없습니다.' };
}

export function getTeacherToken(): string | null {
  return localStorage.getItem(TEACHER_TOKEN_KEY);
}

export function saveTeacherToken(token: string): void {
  localStorage.setItem(TEACHER_TOKEN_KEY, token);
}

export function clearTeacherToken(): void {
  localStorage.removeItem(TEACHER_TOKEN_KEY);
}

export async function loginTeacher(password: string): Promise<TeacherActionResponse<TeacherSession>> {
  if (!isSupabaseConfigured) {
    if (password !== '0901') {
      return { error: '비밀번호가 맞지 않습니다.' };
    }

    return {
      data: {
        token: `local-${Date.now()}`,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      },
    };
  }

  return callTeacherAction<TeacherSession>('login', { password });
}

export async function updateTopic(token: string, date: string, topic: string): Promise<TeacherActionResponse<Round>> {
  return callTeacherAction<Round>('updateTopic', { token, date, topic });
}

export async function deleteEntry(token: string, entryId: string): Promise<TeacherActionResponse<{ id: string }>> {
  return callTeacherAction<{ id: string }>('deleteEntry', { token, entryId });
}

export async function deleteEntriesByDate(token: string, date: string): Promise<TeacherActionResponse<{ date: string }>> {
  return callTeacherAction<{ date: string }>('deleteEntriesByDate', { token, date });
}
