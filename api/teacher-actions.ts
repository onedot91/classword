import { getSql } from './_db';
import { getErrorMessage, getString, isRecord, jsonResponse, parseRound, readJsonBody, rowsFrom } from './_http';

export const config = { runtime: 'edge' };

const UUID_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TeacherAction =
  | { readonly action: 'login' }
  | { readonly action: 'updateTopic'; readonly token: string; readonly date: string; readonly topic: string }
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

    if (action.action === 'deleteEntry') {
      return deleteEntry(action.entryId);
    }

    return deleteEntriesByDate(action.date);
  } catch (error) {
    return jsonResponse({ error: getErrorMessage(error) }, 500);
  }
}
