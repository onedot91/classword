import type { Initial } from '../types/app';
import { getInitialFromWord } from './initials';

const BAD_WORDS = ['씨발', '시발', '병신', '바보', '멍청이', '꺼져', '죽어', '똥개', '좆', 'ㅅㅂ'];
const JAMO_ONLY = /^[ㄱ-ㅎㅏ-ㅣ]+$/;
const NUMBER_ONLY = /^\d+$/;
const SPECIAL_ONLY = /^[^\p{L}\p{N}]+$/u;

export type WordValidationResult =
  | { ok: true; word: string }
  | { ok: false; message: string };

export function validateWord(input: string, selectedInitial: Initial): WordValidationResult {
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

  if (actualInitial !== selectedInitial) {
    return { ok: false, message: `${selectedInitial}으로 시작하는 낱말을 써 주세요.` };
  }

  return { ok: true, word };
}
