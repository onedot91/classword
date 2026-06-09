import type { Entry, Initial, StudentNumber, TeacherActionResponse } from '../types/app';
import { deleteLocalEntry, insertLocalEntry, updateLocalEntry } from './localData';
import { enableLocalDataFallback, supabase } from './supabase';

function isFunctionMissingMessage(message: string): boolean {
  return message.includes('Requested function was not found') || message.includes('Failed to send a request to the Edge Function');
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

async function callStudentAction<T>(action: string, payload: Record<string, unknown>): Promise<TeacherActionResponse<T>> {
  const { data, error } = await supabase.functions.invoke<TeacherActionResponse<T>>('student-actions', {
    body: { action, ...payload },
  });

  if (error) {
    return { error: await getFunctionErrorMessage(error) };
  }

  return data ?? { error: '응답이 없습니다.' };
}

export async function submitStudentEntry(
  date: string,
  initial: Initial,
  word: string,
  studentNumber: StudentNumber,
  entryId?: string,
): Promise<TeacherActionResponse<Entry>> {
  const result = await callStudentAction<Entry>('submitEntry', { date, initial, word, studentNumber, entryId });
  if (!result.error || !isFunctionMissingMessage(result.error)) {
    return result;
  }

  enableLocalDataFallback();
  try {
    const data = entryId ? updateLocalEntry(entryId, initial, word) : insertLocalEntry(date, initial, word, studentNumber);
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : '제출할 수 없어요.' };
  }
}

export async function deleteStudentEntry(entryId: string, studentNumber: StudentNumber): Promise<TeacherActionResponse<{ id: string }>> {
  const result = await callStudentAction<{ id: string }>('deleteEntry', { entryId, studentNumber });
  if (!result.error || !isFunctionMissingMessage(result.error)) {
    return result;
  }

  enableLocalDataFallback();
  deleteLocalEntry(entryId);
  return { data: { id: entryId } };
}
