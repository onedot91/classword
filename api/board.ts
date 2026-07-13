import { getSql } from './_db';
import { getDefaultWordQuiz } from '../src/lib/wordQuiz';
import { getErrorMessage, getPostgresErrorCode, jsonResponse, parseEntry, parseRound, parseSavedRound, parseWordQuiz, rowsFrom } from './_http';

export const config = { runtime: 'edge' };

async function getWordQuiz(date: string) {
  try {
    const sql = getSql();
    const rows = await sql`
      select round_date::text, initial, answer, meaning, example_sentence, updated_at::text
      from word_quizzes
      where round_date = ${date}
      limit 1
    `;
    const quizRows = rowsFrom(rows);
    return quizRows[0] ? parseWordQuiz(quizRows[0]) : getDefaultWordQuiz(date);
  } catch (error) {
    if (getPostgresErrorCode(error) === '42P01' || getPostgresErrorCode(error) === '42703') {
      return getDefaultWordQuiz(date);
    }

    throw error;
  }
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return jsonResponse({ error: '지원하지 않는 요청입니다.' }, 405);
  }

  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    if (!date) {
      return jsonResponse({ error: '날짜가 필요합니다.' }, 400);
    }

    const sql = getSql();
    const [roundRows, entryRows, savedRoundRows, wordQuiz] = await Promise.all([
      sql`
        select id::text, round_date::text, topic, created_at::text, updated_at::text
        from rounds
        where round_date = ${date}
        limit 1
      `,
      sql`
        select id::text, round_date::text, initial, word, student_number, is_mvp, created_at::text
        from entries
        where round_date = ${date}
        order by created_at asc
      `,
      sql`
        select round_date::text, topic
        from rounds
        order by round_date desc
      `,
      getWordQuiz(date),
    ]);

    const rounds = rowsFrom(roundRows);
    const entries = rowsFrom(entryRows).map(parseEntry);
    const savedRounds = rowsFrom(savedRoundRows).map(parseSavedRound);
    const round = rounds[0] ? parseRound(rounds[0]) : null;

    return jsonResponse({ data: { round, entries, savedRounds, wordQuiz } });
  } catch (error) {
    return jsonResponse({ error: getErrorMessage(error) }, 500);
  }
}
