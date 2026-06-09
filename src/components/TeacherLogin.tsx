import { FormEvent, useState } from 'react';
import { Lock } from 'lucide-react';

type TeacherLoginProps = {
  onLogin: (password: string) => Promise<string | null>;
  onBack: () => void;
};

export function TeacherLogin({ onLogin, onBack }: TeacherLoginProps) {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    const error = await onLogin(password);
    setIsSubmitting(false);

    if (error) {
      setMessage(error);
    }
  }

  return (
    <main className="center-page">
      <section className="login-panel">
        <div className="page-kicker">교사용</div>
        <h1>비밀번호</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="teacher-password">교사 비밀번호</label>
          <input
            id="teacher-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            autoFocus
          />
          <button type="submit" disabled={isSubmitting || !password}>
            <Lock size={18} />
            들어가기
          </button>
        </form>
        {message ? <p className="form-message">{message}</p> : null}
        <button type="button" className="text-button" onClick={onBack}>
          번호 다시 선택
        </button>
      </section>
    </main>
  );
}
