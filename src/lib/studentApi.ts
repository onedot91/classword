import type { Entry, Initial, StudentNumber, TeacherActionResponse } from '../types/app';
import { deleteLocalEntry, getLocalWordQuiz, insertLocalEntry, updateLocalEntry, upsertLocalWordQuizSolver } from './localData';
import { enableLocalDataFallback, isApiMissingMessage, isRemoteBackendConfigured, postAction } from './backend';
import { isCorrectQuizAnswer } from './wordQuiz';

async function callStudentAction<T>(action: string, payload: Record<string, unknown>): Promise<TeacherActionResponse<T>> {
  return postAction<T>('/api/student-actions', { action, ...payload });
}

export async function submitStudentEntry(
  date: string,
  initial: Initial,
  word: string,
  studentNumber: StudentNumber,
  entryId?: string,
): Promise<TeacherActionResponse<Entry>> {
  const result = await callStudentAction<Entry>('submitEntry', { date, initial, word, studentNumber, entryId });
  if (!result.error || !isApiMissingMessage(result.error)) {
    return result;
  }

  if (isRemoteBackendConfigured) {
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
  if (!result.error || !isApiMissingMessage(result.error)) {
    return result;
  }

  if (isRemoteBackendConfigured) {
    return result;
  }

  enableLocalDataFallback();
  deleteLocalEntry(entryId);
  return { data: { id: entryId } };
}

export async function submitWordQuizAnswer(date: string, answer: string, studentNumber: StudentNumber): Promise<TeacherActionResponse<{ correct: boolean }>> {
  const result = await callStudentAction<{ correct: boolean }>('submitQuiz', { date, answer, studentNumber });
  if (!result.error || !isApiMissingMessage(result.error)) {
    return result;
  }

  if (isRemoteBackendConfigured) {
    return result;
  }

  enableLocalDataFallback();
  const correct = isCorrectQuizAnswer(answer, getLocalWordQuiz(date).answer);
  if (correct) {
    upsertLocalWordQuizSolver(date, studentNumber);
  }

  return { data: { correct } };
}
