import type { Entry, Initial, Round, StudentNumber, WordQuiz } from '../src/types/app';
import { getQuizInitialHint } from '../src/lib/wordQuiz';

export type ActionResponse<T> = {
  readonly data?: T;
  readonly error?: string;
};

export type BoardResponse = {
  readonly round: Round | null;
  readonly entries: readonly Entry[];
  readonly savedRounds: readonly Pick<Round, 'round_date' | 'topic'>[];
  readonly wordQuiz: WordQuiz;
};

type Row = Record<string, unknown>;

export const INITIALS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'] as const;

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function isRecord(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function rowsFrom(value: unknown): readonly Row[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

export function getString(row: Row, key: string): string {
  const value = row[key];
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${key}`);
  }

  return value;
}

export function getBoolean(row: Row, key: string): boolean {
  const value = row[key];
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid ${key}`);
  }

  return value;
}

export function getStudentNumber(value: unknown): StudentNumber | null {
  switch (value) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
    case 12:
    case 13:
    case 14:
    case 15:
    case 16:
    case 17:
    case 18:
    case 19:
    case 20:
    case 21:
    case 22:
    case 23:
      return value;
    default:
      return null;
  }
}

export function getInitial(value: unknown): Initial | null {
  switch (value) {
    case 'ㄱ':
    case 'ㄴ':
    case 'ㄷ':
    case 'ㄹ':
    case 'ㅁ':
    case 'ㅂ':
    case 'ㅅ':
    case 'ㅇ':
    case 'ㅈ':
    case 'ㅊ':
    case 'ㅋ':
    case 'ㅌ':
    case 'ㅍ':
    case 'ㅎ':
      return value;
    default:
      return null;
  }
}

export function parseRound(row: Row): Round {
  return {
    id: getString(row, 'id'),
    round_date: getString(row, 'round_date'),
    topic: getString(row, 'topic'),
    created_at: getString(row, 'created_at'),
    updated_at: getString(row, 'updated_at'),
  };
}

export function parseEntry(row: Row): Entry {
  const initial = getInitial(row.initial);
  const studentNumber = getStudentNumber(row.student_number);

  if (!initial || !studentNumber) {
    throw new Error('Invalid entry row');
  }

  return {
    id: getString(row, 'id'),
    round_date: getString(row, 'round_date'),
    initial,
    word: getString(row, 'word'),
    student_number: studentNumber,
    is_mvp: getBoolean(row, 'is_mvp'),
    created_at: getString(row, 'created_at'),
  };
}

export function parseSavedRound(row: Row): Pick<Round, 'round_date' | 'topic'> {
  return {
    round_date: getString(row, 'round_date'),
    topic: getString(row, 'topic'),
  };
}

export function parseWordQuiz(row: Row): WordQuiz {
  const initial = getInitial(row.initial);
  const answer = getString(row, 'answer');
  if (!initial) {
    throw new Error('Invalid word quiz row');
  }

  return {
    round_date: getString(row, 'round_date'),
    initial,
    initial_hint: getQuizInitialHint(answer),
    answer,
    meaning: getString(row, 'meaning'),
    example_sentence: getString(row, 'example_sentence'),
    updated_at: getString(row, 'updated_at'),
  };
}

export function getPostgresErrorCode(error: unknown): string | null {
  return isRecord(error) && typeof error.code === 'string' ? error.code : null;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '요청을 처리할 수 없습니다.';
}
