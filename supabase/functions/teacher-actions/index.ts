import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

type TeacherAction =
  | { action: 'login' }
  | { action: 'updateTopic'; token: string; date: string; topic: string }
  | { action: 'deleteEntry'; token: string; entryId: string }
  | { action: 'deleteEntriesByDate'; token: string; date: string };

const DEFAULT_ALLOWED_ORIGINS = ['https://classword.vercel.app'];
const LOCAL_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function getAllowedOrigins(): string[] {
  const configuredOrigins = Deno.env
    .get('CORS_ALLOWED_ORIGINS')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins?.length ? configuredOrigins : [...DEFAULT_ALLOWED_ORIGINS, ...LOCAL_ALLOWED_ORIGINS];
}

function getCorsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('Origin');
  const headers: Record<string, string> = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (origin && getAllowedOrigins().includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

const supabaseUrl = requireEnv('SUPABASE_URL');
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function validateTeacherToken(token: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('teacher_sessions')
    .select('token')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  return !error && Boolean(data);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    const body = (await req.json()) as TeacherAction;

    if (body.action === 'login') {
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('teacher_sessions')
        .insert({ expires_at: expiresAt })
        .select('token, expires_at')
        .single();

      if (error) {
        return jsonResponse(req, { error: error.message }, 500);
      }

      return jsonResponse(req, { data: { token: data.token, expiresAt: data.expires_at } });
    }

    if (!(await validateTeacherToken(body.token))) {
      return jsonResponse(req, { error: '다시 로그인해 주세요.' }, 401);
    }

    if (body.action === 'updateTopic') {
      const topic = body.topic.trim();
      const { data, error } = await supabase
        .from('rounds')
        .upsert({ round_date: body.date, topic }, { onConflict: 'round_date' })
        .select('*')
        .single();

      if (error) {
        return jsonResponse(req, { error: error.message }, 500);
      }

      return jsonResponse(req, { data });
    }

    if (body.action === 'deleteEntry') {
      const { error } = await supabase.from('entries').delete().eq('id', body.entryId);
      if (error) {
        return jsonResponse(req, { error: error.message }, 500);
      }

      return jsonResponse(req, { data: { id: body.entryId } });
    }

    if (body.action === 'deleteEntriesByDate') {
      const { error } = await supabase.from('entries').delete().eq('round_date', body.date);
      if (error) {
        return jsonResponse(req, { error: error.message }, 500);
      }

      return jsonResponse(req, { data: { date: body.date } });
    }

    return jsonResponse(req, { error: '알 수 없는 작업입니다.' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : '요청을 처리할 수 없습니다.';
    return jsonResponse(req, { error: message }, 500);
  }
});
