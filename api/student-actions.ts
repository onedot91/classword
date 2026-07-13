import type { Initial, StudentNumber } from '../src/types/app';
import { getSql } from './_db';
import {
  getErrorMessage,
  getInitial,
  getPostgresErrorCode,
  getStudentNumber,
  getString,
  isRecord,
  jsonResponse,
  parseEntry,
  readJsonBody,
  rowsFrom,
} from './_http';
import { validateWord } from '../src/lib/validation';
import { getDefaultWordQuiz, isCorrectQuizAnswer } from '../src/lib/wordQuiz';

export const config = { runtime: 'edge' };

type SubmitEntryAction = {
  readonly action: 'submitEntry';
  readonly date: string;
  readonly initial: Initial;
  readonly word: string;
  readonly studentNumber: StudentNumber;
  readonly entryId?: string;
};

type DeleteEntryAction = {
  readonly action: 'deleteEntry';
  readonly entryId: string;
  readonly studentNumber: StudentNumber;
};

type SubmitQuizAction = {
  readonly action: 'submitQuiz';
  readonly date: string;
  readonly answer: string;
  readonly studentNumber: StudentNumber;
};

type StudentAction = SubmitEntryAction | DeleteEntryAction | SubmitQuizAction;

async function recordMissionEvent(studentNumber: StudentNumber, date: string, eventType: 'word_entry' | 'quiz_correct'): Promise<void> {
  try {
    const sql = getSql();
    await sql`
      insert into student_mission_events (student_number, event_date, event_type)
      values (${studentNumber}, ${date}, ${eventType})
      on conflict (student_number, event_date, event_type) do nothing
    `;
  } catch (error) {
    if (getPostgresErrorCode(error) !== '42P01') {
      throw error;
    }
  }
}

function parseStudentAction(body: unknown): StudentAction | null {
  if (!isRecord(body) || typeof body.action !== 'string') {
    return null;
  }

  if (body.action === 'submitEntry') {
    const initial = getInitial(body.initial);
    const studentNumber = getStudentNumber(body.studentNumber);
    if (typeof body.date !== 'string' || !initial || typeof body.word !== 'string' || !studentNumber) {
      return null;
    }

    return {
      action: 'submitEntry',
      date: body.date,
      initial,
      word: body.word,
      studentNumber,
      ...(typeof body.entryId === 'string' ? { entryId: body.entryId } : {}),
    };
  }

  if (body.action === 'deleteEntry') {
    const studentNumber = getStudentNumber(body.studentNumber);
    if (typeof body.entryId !== 'string' || !studentNumber) {
      return null;
    }

    return { action: 'deleteEntry', entryId: body.entryId, studentNumber };
  }

  if (body.action === 'submitQuiz') {
    const studentNumber = getStudentNumber(body.studentNumber);
    if (typeof body.date !== 'string' || typeof body.answer !== 'string' || !studentNumber) {
      return null;
    }

    return { action: 'submitQuiz', date: body.date, answer: body.answer, studentNumber };
  }

  return null;
}

async function submitEntry(action: SubmitEntryAction): Promise<Response> {
  const sql = getSql();
  const roundRows = await sql`
    select topic
    from rounds
    where round_date = ${action.date}
    limit 1
  `;
  const rounds = rowsFrom(roundRows);
  const roundTopic = rounds[0] ? getString(rounds[0], 'topic') : '';
  const validation = validateWord(action.word, action.initial, roundTopic);

  if (!validation.ok) {
    return jsonResponse({ error: validation.message }, 400);
  }

  await sql`
    insert into rounds (round_date, topic)
    values (${action.date}, '')
    on conflict (round_date) do nothing
  `;

  const occupiedRows = await sql`
    select id::text
    from entries
    where round_date = ${action.date}
      and initial = ${action.initial}
    limit 1
  `;

  const occupiedEntries = rowsFrom(occupiedRows);
  if (occupiedEntries[0] && getString(occupiedEntries[0], 'id') !== action.entryId) {
    return jsonResponse({ error: '이미 채워진 칸이에요.' }, 409);
  }

  if (action.entryId) {
    const existingRows = await sql`
      select id::text, student_number
      from entries
      where id = ${action.entryId}
      limit 1
    `;
    const existingEntries = rowsFrom(existingRows);
    const existingStudentNumber = existingEntries[0] ? getStudentNumber(existingEntries[0].student_number) : null;

    if (!existingStudentNumber || existingStudentNumber !== action.studentNumber) {
      return jsonResponse({ error: '수정할 낱말을 찾을 수 없어요.' }, 404);
    }

    const updatedRows = await sql`
      update entries
      set initial = ${action.initial}, word = ${validation.word}
      where id = ${action.entryId}
        and student_number = ${action.studentNumber}
      returning id::text, round_date::text, initial, word, student_number, is_mvp, created_at::text
    `;
    const updatedEntries = rowsFrom(updatedRows);
    const updatedEntry = updatedEntries[0] ? parseEntry(updatedEntries[0]) : null;

    if (!updatedEntry) {
      return jsonResponse({ error: '수정할 낱말을 찾을 수 없어요.' }, 404);
    }

    await recordMissionEvent(action.studentNumber, action.date, 'word_entry');
    return jsonResponse({ data: updatedEntry });
  }

  try {
    const insertedRows = await sql`
      insert into entries (round_date, initial, word, student_number)
      values (${action.date}, ${action.initial}, ${validation.word}, ${action.studentNumber})
      returning id::text, round_date::text, initial, word, student_number, is_mvp, created_at::text
    `;
    const insertedEntries = rowsFrom(insertedRows);
    const insertedEntry = insertedEntries[0] ? parseEntry(insertedEntries[0]) : null;

    if (!insertedEntry) {
      return jsonResponse({ error: '제출할 수 없어요.' }, 500);
    }

    await recordMissionEvent(action.studentNumber, action.date, 'word_entry');
    return jsonResponse({ data: insertedEntry });
  } catch (error) {
    if (getPostgresErrorCode(error) === '23505') {
      return jsonResponse({ error: '오늘은 한 번만 제출할 수 있어요.' }, 409);
    }

    throw error;
  }
}

async function deleteEntry(action: DeleteEntryAction): Promise<Response> {
  const sql = getSql();
  const deletedRows = await sql`
    delete from entries
    where id = ${action.entryId}
      and student_number = ${action.studentNumber}
    returning id::text
  `;

  if (rowsFrom(deletedRows).length === 0) {
    return jsonResponse({ error: '삭제할 낱말을 찾을 수 없어요.' }, 404);
  }

  return jsonResponse({ data: { id: action.entryId } });
}

async function submitQuiz(action: SubmitQuizAction): Promise<Response> {
  let answer = getDefaultWordQuiz(action.date).answer;

  try {
    const sql = getSql();
    const quizRows = await sql`
      select answer
      from word_quizzes
      where round_date = ${action.date}
      limit 1
    `;
    const rows = rowsFrom(quizRows);
    answer = rows[0] ? getString(rows[0], 'answer') : answer;
  } catch (error) {
    if (getPostgresErrorCode(error) !== '42P01') {
      throw error;
    }
  }

  const correct = isCorrectQuizAnswer(action.answer, answer);
  if (correct) {
    try {
      const sql = getSql();
      await sql`
        insert into rounds (round_date, topic)
        values (${action.date}, '')
        on conflict (round_date) do nothing
      `;
      await sql`
        insert into word_quiz_solvers (round_date, student_number)
        values (${action.date}, ${action.studentNumber})
        on conflict (round_date, student_number)
        do update set solved_at = excluded.solved_at
      `;
    } catch (error) {
      if (getPostgresErrorCode(error) !== '42P01') {
        throw error;
      }
    }

    await recordMissionEvent(action.studentNumber, action.date, 'quiz_correct');
  }

  return jsonResponse({ data: { correct } });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: '지원하지 않는 요청입니다.' }, 405);
  }

  try {
    const action = parseStudentAction(await readJsonBody(request));
    if (!action) {
      return jsonResponse({ error: '요청을 처리할 수 없습니다.' }, 400);
    }

    if (action.action === 'submitEntry') {
      return submitEntry(action);
    }

    if (action.action === 'submitQuiz') {
      return submitQuiz(action);
    }

    return deleteEntry(action);
  } catch (error) {
    return jsonResponse({ error: getErrorMessage(error) }, 500);
  }
}
