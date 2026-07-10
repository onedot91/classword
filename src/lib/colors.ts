import type { StudentNumber } from '../types/app';
import { getTodayDateKey } from './date';

const STUDENT_COLORS = [
  '#E76F51',
  '#D62828',
  '#F4C430',
  '#2A9D8F',
  '#264653',
  '#7B2CBF',
  '#4361EE',
  '#3A0CA3',
  '#2B9348',
  '#00A8E8',
  '#AACC00',
  '#FF006E',
  '#FB8500',
  '#6D597A',
  '#B56576',
  '#0077B6',
  '#00B4D8',
  '#F07167',
  '#8AC926',
  '#8338EC',
  '#FF5A5F',
  '#BC6C25',
  '#52796F',
] as const;

const FALLBACK_STUDENT_COLOR = '#e9ecef';
const DARK_TEXT = 'var(--ink)';
const LIGHT_TEXT = 'var(--canvas)';

function hashDateKey(dateKey: string): number {
  let hash = 2166136261;

  for (const character of dateKey) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function nextSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function getDailyStudentColors(dateKey: string): readonly string[] {
  const colors = [...STUDENT_COLORS];
  let seed = hashDateKey(dateKey);

  for (let index = colors.length - 1; index > 0; index -= 1) {
    seed = nextSeed(seed);
    const targetIndex = seed % (index + 1);
    const color = colors[index];
    const targetColor = colors[targetIndex];

    if (color === undefined || targetColor === undefined) {
      return colors;
    }

    colors[index] = targetColor;
    colors[targetIndex] = color;
  }

  return colors;
}

function getRelativeLuminance(color: string): number {
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);

  return (red * 299 + green * 587 + blue * 114) / 1000;
}

function getStudentColorToken(studentNumber: StudentNumber) {
  return getDailyStudentColors(getTodayDateKey())[studentNumber - 1] ?? FALLBACK_STUDENT_COLOR;
}

export function getStudentColor(studentNumber: StudentNumber): string {
  return getStudentColorToken(studentNumber);
}

export function getStudentBorderColor(studentNumber: StudentNumber): string {
  return `color-mix(in srgb, ${getStudentColorToken(studentNumber)} 78%, black)`;
}

export function getStudentTextColor(studentNumber: StudentNumber): string {
  return getRelativeLuminance(getStudentColorToken(studentNumber)) < 128 ? LIGHT_TEXT : DARK_TEXT;
}
