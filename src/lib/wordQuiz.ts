import type { Initial, WordQuiz } from '../types/app';
import { getInitialFromWord, getInitialsFromWord, isSupportedInitial } from './initials';

const DAILY_WORD_QUIZZES = [
  { answer: '관찰', meaning: '자세히 살펴보며 특징을 알아보는 일', example_sentence: '우리는 강낭콩이 자라는 모습을 관찰했다.' },
  { answer: '약속', meaning: '서로 꼭 지키기로 정한 말이나 일', example_sentence: '친구와 한 약속은 꼭 지켜야 한다.' },
  { answer: '절약', meaning: '물건이나 돈, 에너지를 아껴서 쓰는 일', example_sentence: '물을 절약하려고 양치할 때 컵을 사용했다.' },
  { answer: '협동', meaning: '여러 사람이 힘을 합쳐 함께 하는 일', example_sentence: '모둠 친구들이 협동해서 작품을 완성했다.' },
  { answer: '환경', meaning: '사람과 동식물이 살아가는 주변 조건', example_sentence: '깨끗한 환경을 만들기 위해 쓰레기를 주웠다.' },
  { answer: '배려', meaning: '다른 사람의 마음과 처지를 생각해 주는 일', example_sentence: '다친 친구를 먼저 지나가게 한 것은 배려이다.' },
  { answer: '전통', meaning: '옛날부터 이어져 내려오는 생활 방식이나 문화', example_sentence: '설날에 세배를 하는 것은 우리 전통이다.' },
  { answer: '규칙', meaning: '여럿이 함께 지키기로 정한 기준', example_sentence: '도서관에서는 조용히 하는 규칙을 지킨다.' },
  { answer: '탐구', meaning: '궁금한 것을 깊이 알아보고 찾아보는 일', example_sentence: '자석의 성질을 알아보려고 탐구 활동을 했다.' },
  { answer: '소중', meaning: '매우 귀하고 중요함', example_sentence: '가족과 친구는 나에게 소중한 사람들이다.' },
  { answer: '분류', meaning: '같은 점과 다른 점에 따라 나누는 일', example_sentence: '동물을 사는 곳에 따라 분류해 보았다.' },
  { answer: '기록', meaning: '나중에 보려고 글이나 그림으로 남기는 일', example_sentence: '오늘 있었던 일을 일기장에 기록했다.' },
  { answer: '예절', meaning: '다른 사람을 존중하며 지키는 바른 태도', example_sentence: '어른께 공손히 인사하는 것은 예절이다.' },
  { answer: '순서', meaning: '일이나 물건이 차례대로 놓인 자리', example_sentence: '발표할 사람을 순서대로 정했다.' },
] as const;

const DOUBLE_TO_BASE_INITIAL: Record<string, Initial> = {
  ㄲ: 'ㄱ',
  ㄸ: 'ㄷ',
  ㅃ: 'ㅂ',
  ㅆ: 'ㅅ',
  ㅉ: 'ㅈ',
};

function getDateIndex(date: string): number {
  const digits = date.replace(/\D/g, '');
  const numberValue = Number(digits);
  return Number.isFinite(numberValue) ? numberValue % DAILY_WORD_QUIZZES.length : 0;
}

export function getQuizInitial(answer: string): Initial {
  const initial = getInitialFromWord(answer);
  if (!initial) {
    return 'ㅇ';
  }

  if (isSupportedInitial(initial)) {
    return initial;
  }

  return DOUBLE_TO_BASE_INITIAL[initial] ?? 'ㅇ';
}

export function getQuizInitialHint(answer: string): string {
  return getInitialsFromWord(answer) || getQuizInitial(answer);
}

export function getDefaultWordQuiz(date: string): WordQuiz {
  const quiz = DAILY_WORD_QUIZZES[getDateIndex(date)];
  return {
    round_date: date,
    initial: getQuizInitial(quiz.answer),
    initial_hint: getQuizInitialHint(quiz.answer),
    answer: quiz.answer,
    meaning: quiz.meaning,
    example_sentence: quiz.example_sentence,
  };
}

export function normalizeQuizAnswer(value: string): string {
  return value.trim().replace(/\s+/g, '');
}

export function isCorrectQuizAnswer(input: string, answer: string): boolean {
  return normalizeQuizAnswer(input) === normalizeQuizAnswer(answer);
}

export function maskQuizAnswerInSentence(sentence: string, answer: string): string {
  const normalizedSentence = sentence.trim();
  const normalizedAnswer = answer.trim();
  if (!normalizedSentence || !normalizedAnswer) {
    return normalizedSentence;
  }

  return normalizedSentence.split(normalizedAnswer).join('□'.repeat(normalizedAnswer.length));
}
