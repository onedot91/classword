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

function validateWord(input: string, selectedInitial: Initial): { ok: true; word: string } | { ok: false; message: string } {
  const word = input.trim();

  if (!word) {
    return { ok: false, message: '낱말을 입력해 주세요.' };
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
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: '지원하지 않는 요청입니다.' }, 405);
  }

  try {
    const body = (await req.json()) as StudentAction;

    if (body.action === 'submitEntry') {
      const dateError = validateDate(body.date);
      if (dateError) {
        return jsonResponse({ error: dateError }, 400);
      }

      const studentError = validateStudentNumber(body.studentNumber);
      if (studentError) {
        return jsonResponse({ error: studentError }, 400);
      }

      if (!INITIALS.includes(body.initial)) {
        return jsonResponse({ error: '초성이 올바르지 않아요.' }, 400);
      }

      const validation = validateWord(body.word, body.initial);
      if (!validation.ok) {
        return jsonResponse({ error: validation.message }, 400);
      }

      const { error: roundError } = await supabase
        .from('rounds')
        .insert({ round_date: body.date, topic: '' })
        .select('id')
        .single();

      if (roundError && roundError.code !== '23505') {
        return jsonResponse({ error: roundError.message }, 500);
      }

      const occupiedByInitial = await supabase
        .from('entries')
        .select('id')
        .eq('round_date', body.date)
        .eq('initial', body.initial)
        .maybeSingle();

      if (occupiedByInitial.error) {
        return jsonResponse({ error: occupiedByInitial.error.message }, 500);
      }

      if (occupiedByInitial.data && occupiedByInitial.data.id !== body.entryId) {
        return jsonResponse({ error: '이미 채워진 칸이에요.' }, 409);
      }

      if (body.entryId) {
        const existing = await supabase
          .from('entries')
          .select('id, student_number')
          .eq('id', body.entryId)
          .maybeSingle();

        if (existing.error) {
          return jsonResponse({ error: existing.error.message }, 500);
        }

        if (!existing.data || existing.data.student_number !== body.studentNumber) {
          return jsonResponse({ error: '수정할 낱말을 찾을 수 없어요.' }, 404);
        }

        const { data, error } = await supabase
          .from('entries')
          .update({ initial: body.initial, word: validation.word })
          .eq('id', body.entryId)
          .eq('student_number', body.studentNumber)
          .select('*')
          .single();

        if (error) {
          return jsonResponse({ error: error.message }, 500);
        }

        return jsonResponse({ data });
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
          return jsonResponse({ error: '오늘은 한 번만 제출할 수 있어요.' }, 409);
        }
        return jsonResponse({ error: error.message }, 500);
      }

      return jsonResponse({ data });
    }

    if (body.action === 'deleteEntry') {
      const studentError = validateStudentNumber(body.studentNumber);
      if (studentError) {
        return jsonResponse({ error: studentError }, 400);
      }

      const { data, error } = await supabase
        .from('entries')
        .delete()
        .eq('id', body.entryId)
        .eq('student_number', body.studentNumber)
        .select('id')
        .maybeSingle();

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      if (!data) {
        return jsonResponse({ error: '삭제할 낱말을 찾을 수 없어요.' }, 404);
      }

      return jsonResponse({ data: { id: body.entryId } });
    }

    return jsonResponse({ error: '알 수 없는 작업입니다.' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : '요청을 처리할 수 없습니다.';
    return jsonResponse({ error: message }, 500);
  }
});
