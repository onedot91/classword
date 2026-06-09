const SEOUL_TIME_ZONE = 'Asia/Seoul';

export function getTodayDateKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function formatKoreanDate(dateKey: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${dateKey}T00:00:00+09:00`));
}
