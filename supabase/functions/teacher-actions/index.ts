import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

type TeacherAction =
  | { action: 'login'; password: string }
  | { action: 'updateTopic'; token: string; date: string; topic: string }
  | { action: 'deleteEntry'; token: string; entryId: string };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
const teacherPassword = Deno.env.get('TEACHER_PASSWORD') ?? '0901';

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
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as TeacherAction;

    if (body.action === 'login') {
      if (body.password !== teacherPassword) {
        return jsonResponse({ error: '비밀번호가 맞지 않습니다.' }, 401);
      }

      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('teacher_sessions')
        .insert({ expires_at: expiresAt })
        .select('token, expires_at')
        .single();

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      return jsonResponse({ data: { token: data.token, expiresAt: data.expires_at } });
    }

    if (!(await validateTeacherToken(body.token))) {
      return jsonResponse({ error: '다시 로그인해 주세요.' }, 401);
    }

    if (body.action === 'updateTopic') {
      const topic = body.topic.trim();
      const { data, error } = await supabase
        .from('rounds')
        .upsert({ round_date: body.date, topic }, { onConflict: 'round_date' })
        .select('*')
        .single();

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      return jsonResponse({ data });
    }

    if (body.action === 'deleteEntry') {
      const { error } = await supabase.from('entries').delete().eq('id', body.entryId);
      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      return jsonResponse({ data: { id: body.entryId } });
    }

    return jsonResponse({ error: '알 수 없는 작업입니다.' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : '요청을 처리할 수 없습니다.';
    return jsonResponse({ error: message }, 500);
  }
});
