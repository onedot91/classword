import { getSql } from './_db';
import { getErrorMessage, getPostgresErrorCode, getString, isRecord, jsonResponse, parseRound, readJsonBody, rowsFrom } from './_http';
import { getQuizInitial, getQuizInitialHint } from '../src/lib/wordQuiz';

export const config = { runtime: 'edge' };

const UUID_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TeacherAction =
  | { readonly action: 'login' }
  | { readonly action: 'updateTopic'; readonly token: string; readonly date: string; readonly topic: string }
  | { readonly action: 'updateWordQuiz'; readonly token: string; readonly date: string; readonly answer: string; readonly meaning: string; readonly exampleSentence: string }
  | { readonly action: 'deleteEntry'; readonly token: string; readonly entryId: string }
  | { readonly action: 'deleteEntriesByDate'; readonly token: string; readonly date: string };

function parseTeacherAction(body: unknown): TeacherAction | null {
  if (!isRecord(body) || typeof body.action !== 'string') {
    return null;
  }

  if (body.action === 'login') {
    return { action: 'login' };
  }

  if (body.action === 'updateTopic') {
    if (typeof body.token !== 'string' || typeof body.date !== 'string' || typeof body.topic !== 'string') {
      return null;
    }

    return { action: 'updateTopic', token: body.token, date: body.date, topic: body.topic };
  }

  if (body.action === 'deleteEntry') {
    if (typeof body.token !== 'string' || typeof body.entryId !== 'string') {
      return null;
    }

    return { action: 'deleteEntry', token: body.token, entryId: body.entryId };
  }

  if (body.action === 'updateWordQuiz') {
    if (
      typeof body.token !== 'string' ||
      typeof body.date !== 'string' ||
      typeof body.answer !== 'string' ||
      typeof body.meaning !== 'string' ||
      typeof body.exampleSentence !== 'string'
    ) {
      return null;
    }

    return {
      action: 'updateWordQuiz',
      token: body.token,
      date: body.date,
      answer: body.answer,
      meaning: body.meaning,
      exampleSentence: body.exampleSentence,
    };
  }

  if (body.action === 'deleteEntriesByDate') {
    if (typeof body.token !== 'string' || typeof body.date !== 'string') {
      return null;
    }

    return { action: 'deleteEntriesByDate', token: body.token, date: body.date };
  }

  return null;
}

async function validateTeacherToken(token: string): Promise<boolean> {
  if (!UUID_TOKEN_PATTERN.test(token)) {
    return false;
  }

  const sql = getSql();
  const rows = await sql`
    select token::text
    from teacher_sessions
    where token = ${token}
      and expires_at > now()
    limit 1
  `;

  return rowsFrom(rows).length > 0;
}

async function loginTeacher(): Promise<Response> {
  const sql = getSql();
  const rows = await sql`
    insert into teacher_sessions (expires_at)
    values (now() + interval '12 hours')
    returning token::text, expires_at::text
  `;

  const sessionRows = rowsFrom(rows);
  const row = sessionRows[0] ?? null;
  if (!row) {
    return jsonResponse({ error: '교사용 화면으로 들어갈 수 없습니다.' }, 500);
  }

  return jsonResponse({ data: { token: getString(row, 'token'), expiresAt: getString(row, 'expires_at') } });
}

async function updateTopic(action: Extract<TeacherAction, { readonly action: 'updateTopic' }>): Promise<Response> {
  const sql = getSql();
  const rows = await sql`
    insert into rounds (round_date, topic)
    values (${action.date}, ${action.topic.trim()})
    on conflict (round_date)
    do update set topic = excluded.topic
    returning id::text, round_date::text, topic, created_at::text, updated_at::text
  `;
  const roundRows = rowsFrom(rows);
  const round = roundRows[0] ? parseRound(roundRows[0]) : null;

  if (!round) {
    return jsonResponse({ error: '주제를 저장할 수 없습니다.' }, 500);
  }

  return jsonResponse({ data: round });
}

async function updateWordQuiz(action: Extract<TeacherAction, { readonly action: 'updateWordQuiz' }>): Promise<Response> {
  const answer = action.answer.trim();
  const meaning = action.meaning.trim();
  const exampleSentence = action.exampleSentence.trim();
  if (!answer || !meaning || !exampleSentence) {
    return jsonResponse({ error: '낱말, 뜻, 예문을 모두 입력해 주세요.' }, 400);
  }

  const sql = getSql();
  const initial = getQuizInitial(answer);
  await sql`
    insert into rounds (round_date, topic)
    values (${action.date}, '')
    on conflict (round_date) do nothing
  `;
  const rows = await sql`
    insert into word_quizzes (round_date, initial, answer, meaning, example_sentence)
    values (${action.date}, ${initial}, ${answer}, ${meaning}, ${exampleSentence})
    on conflict (round_date)
    do update set
      initial = excluded.initial,
      answer = excluded.answer,
      meaning = excluded.meaning,
      example_sentence = excluded.example_sentence
    returning round_date::text, initial, answer, meaning, example_sentence, updated_at::text
  `;
  const quizRows = rowsFrom(rows);
  const quizRow = quizRows[0] ?? null;

  if (!quizRow) {
    return jsonResponse({ error: '낱말 퀴즈를 저장할 수 없습니다.' }, 500);
  }

  try {
    await sql`
      delete from word_quiz_solvers
      where round_date = ${action.date}
    `;
  } catch (error) {
    if (getPostgresErrorCode(error) !== '42P01') {
      throw error;
    }
  }

  return jsonResponse({
    data: {
      round_date: getString(quizRow, 'round_date'),
      initial: getString(quizRow, 'initial'),
      initial_hint: getQuizInitialHint(getString(quizRow, 'answer')),
      answer: getString(quizRow, 'answer'),
      meaning: getString(quizRow, 'meaning'),
      example_sentence: getString(quizRow, 'example_sentence'),
      updated_at: getString(quizRow, 'updated_at'),
    },
  });
}

async function deleteEntry(entryId: string): Promise<Response> {
  const sql = getSql();
  await sql`
    delete from entries
    where id = ${entryId}
  `;

  return jsonResponse({ data: { id: entryId } });
}

async function deleteEntriesByDate(date: string): Promise<Response> {
  const sql = getSql();
  await sql`
    delete from entries
    where round_date = ${date}
  `;

  return jsonResponse({ data: { date } });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: '지원하지 않는 요청입니다.' }, 405);
  }

  try {
    const action = parseTeacherAction(await readJsonBody(request));
    if (!action) {
      return jsonResponse({ error: '요청을 처리할 수 없습니다.' }, 400);
    }

    if (action.action === 'login') {
      return loginTeacher();
    }

    if (!(await validateTeacherToken(action.token))) {
      return jsonResponse({ error: '다시 로그인해 주세요.' }, 401);
    }

    if (action.action === 'updateTopic') {
      return updateTopic(action);
    }

    if (action.action === 'updateWordQuiz') {
      return updateWordQuiz(action);
    }

    if (action.action === 'deleteEntry') {
      return deleteEntry(action.entryId);
    }

    return deleteEntriesByDate(action.date);
  } catch (error) {
    return jsonResponse({ error: getErrorMessage(error) }, 500);
  }
}
