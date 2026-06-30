import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

type Initial = 'ㄱ' | 'ㄴ' | 'ㄷ' | 'ㄹ' | 'ㅁ' | 'ㅂ' | 'ㅅ' | 'ㅇ' | 'ㅈ' | 'ㅊ' | 'ㅋ' | 'ㅌ' | 'ㅍ' | 'ㅎ';

type StudentAction =
  | { action: 'submitEntry'; date: string; initial: Initial; word: string; studentNumber: number; entryId?: string }
  | { action: 'deleteEntry'; entryId: string; studentNumber: number };

const INITIALS: Initial[] = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const INITIAL_ALIASES: Partial<Record<Initial, string>> = {
  ㄱ: 'ㄲ',
  ㄷ: 'ㄸ',
  ㅂ: 'ㅃ',
  ㅅ: 'ㅆ',
  ㅈ: 'ㅉ',
};
const CHOSEONG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const BAD_WORDS = ['씨발', '시발', '병신', '바보', '멍청이', '꺼져', '죽어', '똥개', '좆', 'ㅅㅂ'];
const JAMO_ONLY = /^[ㄱ-ㅎㅏ-ㅣ]+$/;
const NUMBER_ONLY = /^\d+$/;
const SPECIAL_ONLY = /^[^\p{L}\p{N}]+$/u;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

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

function getInitialFromWord(word: string): string | null {
  const firstChar = word.trim()[0];
  if (!firstChar) {
    return null;
  }

  const code = firstChar.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) {
    return null;
  }

  return CHOSEONG[Math.floor(code / (21 * 28))] ?? null;
}

function getAcceptedInitials(initial: Initial): string[] {
  const alias = INITIAL_ALIASES[initial];
  return alias ? [initial, alias] : [initial];
}

function acceptsWordInitial(selectedInitial: Initial, actualInitial: string): boolean {
  return getAcceptedInitials(selectedInitial).includes(actualInitial);
}

function getInitialPrompt(initial: Initial): string {
  return getAcceptedInitials(initial).join(' 또는 ');
}

function validateDate(date: string): string | null {
  if (!DATE_ONLY.test(date)) {
    return '날짜가 올바르지 않아요.';
  }
  return null;
}

function validateStudentNumber(studentNumber: number): string | null {
  if (!Number.isInteger(studentNumber) || studentNumber < 1 || studentNumber > 23) {
    return '학생 번호가 올바르지 않아요.';
  }
  return null;
}

function normalizeForComparison(value: string): string {
  return value.trim().replace(/\s+/g, '');
}

function validateWord(input: string, selectedInitial: Initial, topic = ''): { ok: true; word: string } | { ok: false; message: string } {
  const word = input.trim();
  const normalizedTopic = normalizeForComparison(topic);

  if (!word) {
    return { ok: false, message: '낱말을 입력해 주세요.' };
  }

  if (normalizedTopic && normalizeForComparison(word) === normalizedTopic) {
    return { ok: false, message: '주제 낱말 말고 다른 낱말을 찾아 주세요.' };
  }

  if (NUMBER_ONLY.test(word)) {
    return { ok: false, message: '숫자만 쓸 수 없어요.' };
  }

  if (SPECIAL_ONLY.test(word)) {
    return { ok: false, message: '낱말을 입력해 주세요.' };
  }

  if ([...word].length > 6) {
    return { ok: false, message: '6글자까지 쓸 수 있어요.' };
  }

  if (JAMO_ONLY.test(word)) {
    return { ok: false, message: '완성된 낱말을 써 주세요.' };
  }

  if (/^(.)\1{2,}$/.test(word)) {
    return { ok: false, message: '다른 낱말을 써 주세요.' };
  }

  if (BAD_WORDS.some((badWord) => word.includes(badWord))) {
    return { ok: false, message: '다른 낱말을 써 주세요.' };
  }

  const actualInitial = getInitialFromWord(word);
  if (!actualInitial) {
    return { ok: false, message: '한글 낱말로 시작해 주세요.' };
  }

  if (!acceptsWordInitial(selectedInitial, actualInitial)) {
    return { ok: false, message: `${getInitialPrompt(selectedInitial)}으로 시작하는 낱말을 써 주세요.` };
  }

  return { ok: true, word };
}

const supabaseUrl = requireEnv('SUPABASE_URL');
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { error: '지원하지 않는 요청입니다.' }, 405);
  }

  try {
    const body = (await req.json()) as StudentAction;

    if (body.action === 'submitEntry') {
      const dateError = validateDate(body.date);
      if (dateError) {
        return jsonResponse(req, { error: dateError }, 400);
      }

      const studentError = validateStudentNumber(body.studentNumber);
      if (studentError) {
        return jsonResponse(req, { error: studentError }, 400);
      }

      if (!INITIALS.includes(body.initial)) {
        return jsonResponse(req, { error: '초성이 올바르지 않아요.' }, 400);
      }

      const currentRound = await supabase
        .from('rounds')
        .select('topic')
        .eq('round_date', body.date)
        .maybeSingle();

      if (currentRound.error) {
        return jsonResponse(req, { error: currentRound.error.message }, 500);
      }

      const validation = validateWord(body.word, body.initial, currentRound.data?.topic ?? '');
      if (!validation.ok) {
        return jsonResponse(req, { error: validation.message }, 400);
      }

      const { error: roundError } = await supabase
        .from('rounds')
        .insert({ round_date: body.date, topic: '' })
        .select('id')
        .single();

      if (roundError && roundError.code !== '23505') {
        return jsonResponse(req, { error: roundError.message }, 500);
      }

      const occupiedByInitial = await supabase
        .from('entries')
        .select('id')
        .eq('round_date', body.date)
        .eq('initial', body.initial)
        .maybeSingle();

      if (occupiedByInitial.error) {
        return jsonResponse(req, { error: occupiedByInitial.error.message }, 500);
      }

      if (occupiedByInitial.data && occupiedByInitial.data.id !== body.entryId) {
        return jsonResponse(req, { error: '이미 채워진 칸이에요.' }, 409);
      }

      if (body.entryId) {
        const existing = await supabase
          .from('entries')
          .select('id, student_number')
          .eq('id', body.entryId)
          .maybeSingle();

        if (existing.error) {
          return jsonResponse(req, { error: existing.error.message }, 500);
        }

        if (!existing.data || existing.data.student_number !== body.studentNumber) {
          return jsonResponse(req, { error: '수정할 낱말을 찾을 수 없어요.' }, 404);
        }

        const { data, error } = await supabase
          .from('entries')
          .update({ initial: body.initial, word: validation.word })
          .eq('id', body.entryId)
          .eq('student_number', body.studentNumber)
          .select('*')
          .single();

        if (error) {
          return jsonResponse(req, { error: error.message }, 500);
        }

        return jsonResponse(req, { data });
      }

      const { data, error } = await supabase
        .from('entries')
        .insert({
          round_date: body.date,
          initial: body.initial,
          word: validation.word,
          student_number: body.studentNumber,
        })
        .select('*')
        .single();

      if (error) {
        if (error.code === '23505') {
          return jsonResponse(req, { error: '오늘은 한 번만 제출할 수 있어요.' }, 409);
        }
        return jsonResponse(req, { error: error.message }, 500);
      }

      return jsonResponse(req, { data });
    }

    if (body.action === 'deleteEntry') {
      const studentError = validateStudentNumber(body.studentNumber);
      if (studentError) {
        return jsonResponse(req, { error: studentError }, 400);
      }

      const { data, error } = await supabase
        .from('entries')
        .delete()
        .eq('id', body.entryId)
        .eq('student_number', body.studentNumber)
        .select('id')
        .maybeSingle();

      if (error) {
        return jsonResponse(req, { error: error.message }, 500);
      }

      if (!data) {
        return jsonResponse(req, { error: '삭제할 낱말을 찾을 수 없어요.' }, 404);
      }

      return jsonResponse(req, { data: { id: body.entryId } });
    }

    return jsonResponse(req, { error: '알 수 없는 작업입니다.' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : '요청을 처리할 수 없습니다.';
    return jsonResponse(req, { error: message }, 500);
  }
});
