import type { StudentNumber } from '../types/app';

const STUDENT_COLORS = [
  { background: '#FF7A59', border: '#CC6247', text: '#111111' },
  { background: '#FF4F8B', border: '#CC3F6F', text: '#111111' },
  { background: '#FF9F1C', border: '#CC7F16', text: '#111111' },
  { background: '#F2C94C', border: '#C2A13D', text: '#111111' },
  { background: '#2EC4B6', border: '#259D92', text: '#111111' },
  { background: '#F8961E', border: '#C67818', text: '#111111' },
  { background: '#4D96FF', border: '#3E78CC', text: '#111111' },
  { background: '#9B5DE5', border: '#7C4AB7', text: '#FFFFFF' },
  { background: '#6BCB77', border: '#56A25F', text: '#111111' },
  { background: '#00B4D8', border: '#0090AD', text: '#111111' },
  { background: '#52B788', border: '#42926D', text: '#111111' },
  { background: '#FFD166', border: '#CCA752', text: '#111111' },
  { background: '#EF476F', border: '#BF3959', text: '#111111' },
  { background: '#4361EE', border: '#364EBE', text: '#FFFFFF' },
  { background: '#48CAE4', border: '#3AA2B6', text: '#111111' },
  { background: '#B5179E', border: '#91127E', text: '#FFFFFF' },
  { background: '#F3722C', border: '#C25B23', text: '#111111' },
  { background: '#90BE6D', border: '#739858', text: '#111111' },
  { background: '#F9844A', border: '#C76A3B', text: '#111111' },
  { background: '#38B000', border: '#2D8D00', text: '#111111' },
  { background: '#E9C46A', border: '#BA9D55', text: '#111111' },
  { background: '#277DA1', border: '#1F6481', text: '#FFFFFF' },
  { background: '#84A59D', border: '#6A847E', text: '#111111' },
] as const;

const FALLBACK_STUDENT_COLOR = {
  background: '#e9ecef',
  border: '#adb5bd',
  text: '#111111',
} as const;

function getStudentColorToken(studentNumber: StudentNumber) {
  return STUDENT_COLORS[studentNumber - 1] ?? FALLBACK_STUDENT_COLOR;
}

export function getStudentColor(studentNumber: StudentNumber): string {
  return getStudentColorToken(studentNumber).background;
}

export function getStudentBorderColor(studentNumber: StudentNumber): string {
  return getStudentColorToken(studentNumber).border;
}

export function getStudentTextColor(studentNumber: StudentNumber): string {
  return getStudentColorToken(studentNumber).text;
}
