import type { StudentNumber } from '../types/app';

const STUDENT_COLORS = [
  '#ffddd2',
  '#fde2e4',
  '#fad2e1',
  '#e2ece9',
  '#bee1e6',
  '#f0efeb',
  '#dfe7fd',
  '#cddafd',
  '#e8e8ff',
  '#d8f3dc',
  '#b7e4c7',
  '#fefae0',
  '#faedcd',
  '#fde4cf',
  '#ffcfd2',
  '#cfbaf0',
  '#a3c4f3',
  '#90dbf4',
  '#98f5e1',
  '#b9fbc0',
  '#fff1a8',
  '#ffd6a5',
  '#caffbf',
];

export function getStudentColor(studentNumber: StudentNumber): string {
  return STUDENT_COLORS[studentNumber - 1] ?? '#e9ecef';
}
