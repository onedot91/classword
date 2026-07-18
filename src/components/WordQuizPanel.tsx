import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { sanitizeWordInput } from '../lib/validation';
import { maskQuizAnswerInSentence } from '../lib/wordQuiz';
import type { StudentNumber, WordQuiz } from '../types/app';

const QUIZ_SOLVED_KEY = 'classword_word_quiz_solved';

type WordQuizPanelProps = {
  wordQuiz: WordQuiz | null;
  studentNumber: StudentNumber;
  isSubmitting?: boolean;
  onSubmit: (answer: string) => Promise<boolean | null>;
};

export function WordQuizPanel({ wordQuiz, studentNumber, isSubmitting, onSubmit }: WordQuizPanelProps) {
  const [answer, setAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [solvedQuizKey, setSolvedQuizKey] = useState('');
  const quizAnswer = wordQuiz?.answer ?? '';
  const currentQuizKey = wordQuiz ? `${studentNumber}:${wordQuiz.round_date}:${wordQuiz.answer}` : '';
  const maskedExampleSentence = wordQuiz ? maskQuizAnswerInSentence(wordQuiz.example_sentence, wordQuiz.answer) : '';
  const isSolved = Boolean(currentQuizKey && solvedQuizKey === currentQuizKey);
  const feedbackClass = isCorrect === false ? 'incorrect' : isCorrect === true ? 'correct' : '';

  useEffect(() => {
    const storedValue = localStorage.getItem(QUIZ_SOLVED_KEY);
    if (quizAnswer && storedValue === currentQuizKey) {
      setAnswer(quizAnswer);
      setIsCorrect(true);
      setSolvedQuizKey(storedValue);
      return;
    }

    setAnswer('');
    setIsCorrect(null);
    setSolvedQuizKey('');
  }, [currentQuizKey, quizAnswer]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedAnswer = answer.trim();
    if (!wordQuiz || !normalizedAnswer) {
      return;
    }

    const correct = await onSubmit(normalizedAnswer);
    if (correct === null) {
      setIsCorrect(false);
      return;
    }

    setIsCorrect(correct);
    if (correct && wordQuiz) {
      localStorage.setItem(QUIZ_SOLVED_KEY, currentQuizKey);
      setSolvedQuizKey(currentQuizKey);
      setAnswer(wordQuiz.answer);
    }
  }

  return (
    <section className={`word-quiz-panel ${isSolved ? 'solved' : ''} ${feedbackClass}`} aria-label="낱말 퀴즈">
      <div className="word-quiz-heading">
        <div className="quiz-initial-badge" aria-label={`초성 ${wordQuiz?.initial_hint ?? ''}`}>
          {wordQuiz?.initial_hint ?? '?'}
        </div>
      </div>

      <div className="quiz-meaning-card">
        <p>
          <span>뜻</span>
          {wordQuiz?.meaning ?? '오늘의 낱말 퀴즈를 준비하고 있어요.'}
        </p>
        {maskedExampleSentence ? (
          <small>
            <span>예문:</span>
            {maskedExampleSentence}
          </small>
        ) : null}
      </div>

      <form className="word-quiz-form" onSubmit={handleSubmit}>
        <input
          value={answer}
          onChange={(event) => setAnswer(sanitizeWordInput(event.target.value))}
          disabled={!wordQuiz || isSubmitting || isSolved}
          placeholder="정답 낱말"
          autoComplete="off"
        />
        <button type="submit" disabled={!wordQuiz || !answer.trim() || isSubmitting || isSolved}>
          {isSolved ? <CheckCircle2 size={18} /> : <Send size={18} />}
          확인
        </button>
      </form>

    </section>
  );
}
