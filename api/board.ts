import { getSql } from './_db';
import { getErrorMessage, jsonResponse, parseEntry, parseRound, parseSavedRound, rowsFrom } from './_http';

export const config = { runtime: 'edge' };

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
    const [roundRows, entryRows, savedRoundRows] = await Promise.all([
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
    ]);

    const rounds = rowsFrom(roundRows);
    const entries = rowsFrom(entryRows).map(parseEntry);
    const savedRounds = rowsFrom(savedRoundRows).map(parseSavedRound);
    const round = rounds[0] ? parseRound(rounds[0]) : null;

    return jsonResponse({ data: { round, entries, savedRounds } });
  } catch (error) {
    return jsonResponse({ error: getErrorMessage(error) }, 500);
  }
}
