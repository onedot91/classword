import type { StudentNumber } from '../src/types/app';
import { getStudentNumber, isRecord } from './_http';

export type MissionEventType = 'word_entry' | 'quiz_correct';

export type MissionStatus = {
  studentNumber: StudentNumber;
  startDate: string;
  endDate: string;
  wordEntryDates: string[];
  quizCorrectDates: string[];
};

export type MissionEventRow = {
  event_date: string;
  event_type: MissionEventType;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 7;

function parseDateOnly(value: string): Date | null {
  if (!DATE_PATTERN.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10) === value ? date : null;
}

export function parseMissionStatusParams(params: URLSearchParams):
  | { ok: true; studentNumber: StudentNumber; startDate: string; endDate: string }
  | { ok: false; error: string } {
  const studentNumberValue = Number(params.get('studentNumber'));
  const studentNumber = getStudentNumber(studentNumberValue);
  const startDate = params.get('startDate') ?? '';
  const endDate = params.get('endDate') ?? '';
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (!studentNumber) {
    return { ok: false, error: '학생 번호는 1~23만 허용됩니다.' };
  }

  if (!start || !end) {
    return { ok: false, error: '날짜는 YYYY-MM-DD 형식이어야 합니다.' };
  }

  if (start.getTime() > end.getTime()) {
    return { ok: false, error: 'startDate는 endDate보다 늦을 수 없습니다.' };
  }

  const rangeDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (rangeDays > MAX_RANGE_DAYS) {
    return { ok: false, error: '최대 조회 범위는 7일입니다.' };
  }

  return { ok: true, studentNumber, startDate, endDate };
}

export function isMissionEventType(value: unknown): value is MissionEventType {
  return value === 'word_entry' || value === 'quiz_correct';
}

export function buildMissionStatus(studentNumber: StudentNumber, startDate: string, endDate: string, rows: readonly unknown[]): MissionStatus {
  const wordEntryDates = new Set<string>();
  const quizCorrectDates = new Set<string>();

  rows.forEach((row) => {
    if (!isRecord(row) || typeof row.event_date !== 'string' || !isMissionEventType(row.event_type)) {
      return;
    }

    const rowStudentNumber = getStudentNumber(row.student_number);
    if (rowStudentNumber && rowStudentNumber !== studentNumber) {
      return;
    }

    if (row.event_type === 'word_entry') {
      wordEntryDates.add(row.event_date);
    }

    if (row.event_type === 'quiz_correct') {
      quizCorrectDates.add(row.event_date);
    }
  });

  return {
    studentNumber,
    startDate,
    endDate,
    wordEntryDates: [...wordEntryDates].sort(),
    quizCorrectDates: [...quizCorrectDates].sort(),
  };
}
