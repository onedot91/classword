import type { Initial } from '../types/app';

const CHOSEONG = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
] as const;

export const INITIALS: Initial[] = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

export const INITIAL_ALIASES: Partial<Record<Initial, string>> = {
  ㄱ: 'ㄲ',
  ㄷ: 'ㄸ',
  ㅂ: 'ㅃ',
  ㅅ: 'ㅆ',
  ㅈ: 'ㅉ',
};

export function getInitialFromWord(word: string): string | null {
  const firstChar = word.trim()[0];
  if (!firstChar) {
    return null;
  }

  const code = firstChar.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) {
    return null;
  }

  const initialIndex = Math.floor(code / (21 * 28));
  return CHOSEONG[initialIndex] ?? null;
}

export function getInitialsFromWord(word: string): string {
  return [...word.trim()]
    .map((char) => getInitialFromWord(char) ?? '')
    .filter(Boolean)
    .join('');
}

export function isSupportedInitial(value: string): value is Initial {
  return INITIALS.includes(value as Initial);
}

export function getAcceptedInitials(initial: Initial): string[] {
  const alias = INITIAL_ALIASES[initial];
  return alias ? [initial, alias] : [initial];
}

export function getInitialLabel(initial: Initial): string {
  const alias = INITIAL_ALIASES[initial];
  return alias ? `${initial}(${alias})` : initial;
}

export function acceptsWordInitial(selectedInitial: Initial, actualInitial: string): boolean {
  return getAcceptedInitials(selectedInitial).includes(actualInitial);
}

export function getInitialPrompt(initial: Initial): string {
  return getAcceptedInitials(initial).join(' 또는 ');
}
