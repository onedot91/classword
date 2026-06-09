import { FormEvent, useEffect, useState } from 'react';
import { Shuffle, Save } from 'lucide-react';

const RANDOM_TOPICS = [
  '동물',
  '음식',
  '식물',
  '직업',
  '탈것',
  '학교',
  '바다',
  '운동',
  '과일',
  '색깔',
  '여행',
  '계절',
  '우리 동네',
  '가족',
  '친구',
  '교실',
  '도서관',
  '놀이터',
  '공원',
  '시장',
  '병원',
  '박물관',
  '우주',
  '별자리',
  '날씨',
  '비 오는 날',
  '눈 오는 날',
  '봄',
  '여름',
  '가을',
  '겨울',
  '명절',
  '생일',
  '소풍',
  '캠핑',
  '등산',
  '물놀이',
  '겨울 놀이',
  '악기',
  '음악',
  '미술',
  '책',
  '동화',
  '만화',
  '영화',
  '게임',
  '로봇',
  '컴퓨터',
  '스마트폰',
  '발명품',
  '도구',
  '주방',
  '옷',
  '신발',
  '가방',
  '문구',
  '장난감',
  '가게',
  '간식',
  '채소',
  '꽃',
  '나무',
  '곤충',
  '새',
  '물고기',
  '공룡',
  '반려동물',
  '농장',
  '숲',
  '강',
  '산',
  '섬',
  '사막',
  '세계 여러 나라',
  '한국',
  '전통 놀이',
  '문화재',
  '역사 인물',
  '위인',
  '감정',
  '기쁨',
  '용기',
  '배려',
  '협동',
  '안전',
  '건강',
  '병',
  '몸',
  '운동장',
  '경기',
  '올림픽',
  '수학',
  '과학',
  '실험',
  '자석',
  '소리',
  '빛',
  '물',
  '불',
  '공기',
  '재활용',
  '환경',
  '에너지',
  '미래',
  '꿈',
  '마법',
  '상상 속 동물',
  '슈퍼히어로',
  '탐정',
  '보물',
  '비밀',
  '빠른 것',
  '느린 것',
  '둥근 것',
  '긴 것',
  '따뜻한 것',
  '차가운 것',
  '소중한 것',
  '무서운 것',
  '재미있는 것',
];

type TopicEditorProps = {
  topic: string;
  savedTopics: string[];
  onSave: (topic: string) => Promise<string | null>;
};

function normalizeTopic(topic: string): string {
  return topic.trim();
}

export function TopicEditor({ topic, savedTopics, onSave }: TopicEditorProps) {
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
    const savedTopicSet = new Set(savedTopics.map(normalizeTopic).filter(Boolean));
    const availableTopics = RANDOM_TOPICS.filter((randomTopic) => !savedTopicSet.has(normalizeTopic(randomTopic)));

    if (availableTopics.length === 0) {
      setMessage('저장하지 않은 랜덤 주제가 없어요.');
      return;
    }

    const nextTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
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
