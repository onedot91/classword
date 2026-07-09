import type { StudentNumber } from '../types/app';

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

const LIGHT_TEXT_STUDENTS = new Set<StudentNumber>([2, 5, 6, 7, 8, 14, 16, 20, 23]);
const FALLBACK_STUDENT_COLOR = '#e9ecef';

function getStudentColorToken(studentNumber: StudentNumber) {
  return STUDENT_COLORS[studentNumber - 1] ?? FALLBACK_STUDENT_COLOR;
}

export function getStudentColor(studentNumber: StudentNumber): string {
  return getStudentColorToken(studentNumber);
}

export function getStudentBorderColor(studentNumber: StudentNumber): string {
  return `color-mix(in srgb, ${getStudentColorToken(studentNumber)} 78%, black)`;
}

export function getStudentTextColor(studentNumber: StudentNumber): string {
  return LIGHT_TEXT_STUDENTS.has(studentNumber) ? 'var(--canvas)' : 'var(--ink)';
}
