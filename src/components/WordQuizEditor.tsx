import { FormEvent, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { sanitizeWordInput } from '../lib/validation';
import { getQuizInitialHint } from '../lib/wordQuiz';
import type { WordQuiz } from '../types/app';

type WordQuizEditorProps = {
  wordQuiz: WordQuiz | null;
  onSave: (answer: string, meaning: string, exampleSentence: string) => Promise<string | null>;
};

export function WordQuizEditor({ wordQuiz, onSave }: WordQuizEditorProps) {
  const [answer, setAnswer] = useState(wordQuiz?.answer ?? '');
  const [meaning, setMeaning] = useState(wordQuiz?.meaning ?? '');
  const [exampleSentence, setExampleSentence] = useState(wordQuiz?.example_sentence ?? '');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const initialHint = answer.trim() ? getQuizInitialHint(answer) : '초성';

  useEffect(() => {
    setAnswer(wordQuiz?.answer ?? '');
    setMeaning(wordQuiz?.meaning ?? '');
    setExampleSentence(wordQuiz?.example_sentence ?? '');
    setMessage('');
  }, [wordQuiz]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedAnswer = answer.trim();
    const normalizedMeaning = meaning.trim();
    const normalizedExampleSentence = exampleSentence.trim();
    if (!normalizedAnswer || !normalizedMeaning || !normalizedExampleSentence) {
      setMessage('낱말, 뜻, 예문을 모두 입력해 주세요.');
      return;
    }

    setIsSaving(true);
    setMessage('');
    const error = await onSave(normalizedAnswer, normalizedMeaning, normalizedExampleSentence);
    setIsSaving(false);
    setMessage(error ?? '낱말 퀴즈를 저장했어요.');
  }

  return (
    <section className="teacher-section word-quiz-editor">
      <div className="section-title-row">
        <h2>낱말 퀴즈</h2>
        <span>{initialHint}</span>
      </div>
      <form onSubmit={handleSubmit} className="word-quiz-editor-form">
        <label>
          <span>정답 낱말</span>
          <input value={answer} onChange={(event) => setAnswer(sanitizeWordInput(event.target.value))} placeholder="예: 관찰" />
        </label>
        <label>
          <span>뜻</span>
          <input value={meaning} onChange={(event) => setMeaning(event.target.value)} placeholder="예: 자세히 살펴보며 특징을 알아보는 일" />
        </label>
        <label>
          <span>예문</span>
          <input value={exampleSentence} onChange={(event) => setExampleSentence(event.target.value)} placeholder="예: 우리는 강낭콩이 자라는 모습을 관찰했다." />
        </label>
        <button type="submit" disabled={isSaving}>
          <Save size={18} />
          저장
        </button>
      </form>
      {message ? <p className="form-message">{message}</p> : null}
    </section>
  );
}
