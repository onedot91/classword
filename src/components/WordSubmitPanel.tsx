import { FormEvent, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import type { Initial } from '../types/app';

type WordSubmitPanelProps = {
  selectedInitial: Initial | null;
  initialWord?: string;
  submitLabel?: string;
  disabled?: boolean;
  onSubmit: (word: string) => Promise<string | null>;
};

export function WordSubmitPanel({ selectedInitial, initialWord = '', submitLabel = '제출', disabled, onSubmit }: WordSubmitPanelProps) {
  const [word, setWord] = useState(initialWord);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingWord, setPendingWord] = useState('');

  useEffect(() => {
    setWord(initialWord);
    setMessage('');
    setPendingWord('');
  }, [initialWord, selectedInitial]);

  async function confirmSubmit() {
    if (!selectedInitial || disabled) {
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    const error = await onSubmit(pendingWord);
    setIsSubmitting(false);

    if (error) {
      setMessage(error);
      setPendingWord('');
      return;
    }

    setWord('');
    setPendingWord('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedInitial || disabled || !word.trim()) {
      return;
    }

    setMessage('');
    setPendingWord(word.trim());
  }

  return (
    <form className="submit-panel" onSubmit={handleSubmit}>
      <label htmlFor="word-input">{selectedInitial ?? '초성'}</label>
      <div className="submit-row">
        <input
          id="word-input"
          value={word}
          onChange={(event) => setWord(event.target.value)}
          disabled={!selectedInitial || disabled || isSubmitting}
          placeholder={selectedInitial ? '낱말' : '빈 칸'}
          autoComplete="off"
        />
        <button type="submit" disabled={!selectedInitial || disabled || isSubmitting}>
          <Send size={18} />
          {submitLabel}
        </button>
      </div>
      {message ? <p className="form-message">{message}</p> : null}
      {pendingWord ? (
        <div className="confirm-panel" role="alert">
          <strong>
            {selectedInitial} {pendingWord}
          </strong>
          <span>맞나요?</span>
          <div className="confirm-actions">
            <button type="button" onClick={confirmSubmit} disabled={isSubmitting}>
              네
            </button>
            <button type="button" className="secondary-button" onClick={() => setPendingWord('')} disabled={isSubmitting}>
              고치기
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
