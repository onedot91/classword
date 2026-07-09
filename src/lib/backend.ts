import type { BoardResponse } from '../../api/_http';
import type { TeacherActionResponse } from '../types/app';

const LOCAL_DATA_FALLBACK_KEY = 'classword_use_local_data_fallback';

export const isRemoteBackendConfigured = import.meta.env.PROD || import.meta.env.VITE_USE_REMOTE_BACKEND === 'true';

export function enableLocalDataFallback(): void {
  if (isRemoteBackendConfigured) {
    sessionStorage.removeItem(LOCAL_DATA_FALLBACK_KEY);
    return;
  }

  sessionStorage.setItem(LOCAL_DATA_FALLBACK_KEY, 'true');
}

export function shouldUseLocalData(): boolean {
  if (isRemoteBackendConfigured) {
    sessionStorage.removeItem(LOCAL_DATA_FALLBACK_KEY);
    return false;
  }

  return sessionStorage.getItem(LOCAL_DATA_FALLBACK_KEY) === 'true' || !isRemoteBackendConfigured;
}

export function isApiMissingMessage(message: string): boolean {
  return message.includes('Not Found') || message.includes('Failed to fetch') || message.includes('Unexpected token');
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<TeacherActionResponse<T>> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const body = (await response.json()) as TeacherActionResponse<T>;

  if (!response.ok && !body.error) {
    return { error: response.statusText || '요청을 처리할 수 없습니다.' };
  }

  return body;
}

export async function getBoard(date: string): Promise<TeacherActionResponse<BoardResponse>> {
  return requestJson<BoardResponse>(`/api/board?date=${encodeURIComponent(date)}`);
}

export async function postAction<T>(path: string, body: Record<string, unknown>): Promise<TeacherActionResponse<T>> {
  return requestJson<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
