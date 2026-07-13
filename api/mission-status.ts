import { getSql } from './_db';
import { getErrorMessage, jsonResponse, rowsFrom } from './_http';
import { buildMissionStatus, parseMissionStatusParams } from './mission-utils';

export const config = { runtime: 'edge' };

const SCHOOL_TIMER_ORIGIN = 'https://school-timer-five.vercel.app';

function missionResponse(body: unknown, status = 200): Response {
  const response = jsonResponse(body, status);
  response.headers.set('Access-Control-Allow-Origin', SCHOOL_TIMER_ORIGIN);
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Vary', 'Origin');
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return missionResponse({}, 204);
  }

  if (request.method !== 'GET') {
    return missionResponse({ error: '지원하지 않는 요청입니다.' }, 405);
  }

  try {
    const url = new URL(request.url);
    const parsed = parseMissionStatusParams(url.searchParams);
    if (!parsed.ok) {
      return missionResponse({ error: parsed.error }, 400);
    }

    const sql = getSql();
    const rows = await sql`
      select event_date::text, event_type
      from student_mission_events
      where student_number = ${parsed.studentNumber}
        and event_date between ${parsed.startDate} and ${parsed.endDate}
      order by event_date asc, event_type asc
    `;

    return missionResponse({
      data: buildMissionStatus(parsed.studentNumber, parsed.startDate, parsed.endDate, rowsFrom(rows)),
    });
  } catch (error) {
    return missionResponse({ error: getErrorMessage(error) }, 500);
  }
}
