import { FormEvent, useEffect, useState } from 'react';
import { Shuffle, Save } from 'lucide-react';

const RANDOM_TOPICS = ['동물', '음식', '식물', '직업', '탈것', '학교', '바다', '운동', '과일', '색깔', '여행', '계절', '우리 동네'];

type TopicEditorProps = {
  topic: string;
  onSave: (topic: string) => Promise<string | null>;
};

export function TopicEditor({ topic, onSave }: TopicEditorProps) {
  const [draft, setDraft] = useState(topic);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(topic);
  }, [topic]);

  async function saveTopic(nextTopic: string) {
    setIsSaving(true);
    setMessage('');
    const error = await onSave(nextTopic.trim());
    setIsSaving(false);
    setMessage(error ?? '저장했어요.');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveTopic(draft);
  }

  async function handleRandomTopic() {
    const nextTopic = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
    setDraft(nextTopic);
    await saveTopic(nextTopic);
  }

  return (
    <section className="teacher-section topic-editor">
      <h2>오늘의 주제</h2>
      <form onSubmit={handleSubmit} className="topic-form">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="주제 입력" />
        <button type="submit" disabled={isSaving || !draft.trim()}>
          <Save size={18} />
          저장
        </button>
        <button type="button" className="secondary-button" onClick={handleRandomTopic} disabled={isSaving}>
          <Shuffle size={18} />
          랜덤
        </button>
      </form>
      {message ? <p className="form-message">{message}</p> : null}
    </section>
  );
}
