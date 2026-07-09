import type { StudentNumber } from '../types/app';
import { getStudentBorderColor, getStudentColor, getStudentTextColor } from '../lib/colors';

type StudentBadgeProps = {
  studentNumber: StudentNumber;
};

export function StudentBadge({ studentNumber }: StudentBadgeProps) {
  return (
    <span
      className="student-badge"
      style={{
        backgroundColor: getStudentColor(studentNumber),
        border: `1px solid ${getStudentBorderColor(studentNumber)}`,
        color: getStudentTextColor(studentNumber),
      }}
    >
      {studentNumber}번
    </span>
  );
}
