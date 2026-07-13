export type StudentNumber =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23;

export type TeacherNumber = 0;
export type UserNumber = TeacherNumber | StudentNumber;

export type Initial =
  | 'ㄱ'
  | 'ㄴ'
  | 'ㄷ'
  | 'ㄹ'
  | 'ㅁ'
  | 'ㅂ'
  | 'ㅅ'
  | 'ㅇ'
  | 'ㅈ'
  | 'ㅊ'
  | 'ㅋ'
  | 'ㅌ'
  | 'ㅍ'
  | 'ㅎ';

export type Round = {
  id: string;
  round_date: string;
  topic: string;
  created_at: string;
  updated_at: string;
};

export type Entry = {
  id: string;
  round_date: string;
  initial: Initial;
  word: string;
  student_number: StudentNumber;
  is_mvp: boolean;
  created_at: string;
};

export type WordQuiz = {
  round_date: string;
  initial: Initial;
  initial_hint: string;
  answer: string;
  meaning: string;
  example_sentence: string;
  updated_at?: string;
};

export type WordQuizSolver = {
  round_date: string;
  student_number: StudentNumber;
  solved_at: string;
};

export type DailyBoardState = {
  date: string;
  topic: string;
  entries: Entry[];
  completedCount: number;
  participantCount: number;
  missingStudents: StudentNumber[];
};

export type TeacherSession = {
  token: string;
  expiresAt: string;
};

export type TeacherActionResponse<T> = {
  data?: T;
  error?: string;
};
