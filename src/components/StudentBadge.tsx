import type { StudentNumber } from '../types/app';
import { getStudentColor } from '../lib/colors';

type StudentBadgeProps = {
  studentNumber: StudentNumber;
};

export function StudentBadge({ studentNumber }: StudentBadgeProps) {
  return (
    <span className="student-badge" style={{ backgroundColor: getStudentColor(studentNumber) }}>
      {studentNumber}번
    </span>
  );
}
