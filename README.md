# classword

초등학교 3학년 학급이 함께 주제에 맞는 낱말을 초성별로 채우는 실시간 웹앱입니다.

## 주요 기능

- 학생 번호 1~23 선택, localStorage 저장
- 숨겨진 교사 번호 0 선택 후 바로 입장
- 오늘의 주제와 14개 초성 카드 표시
- 학생 하루 1회 제출 제한
- 단어 첫 글자 초성과 선택 초성 일치 검증
- Supabase Realtime 기반 즉시 반영
- 교사용 주제 변경, 랜덤 주제, 삭제
- 참여 현황과 날짜별 기록 조회
- 14칸 완성 시 짧은 Confetti 효과

## 폴더 구조

```txt
src/
  app/          앱 진입과 라우팅 상태
  components/   화면 공통/학생/교사 컴포넌트
  lib/          Supabase, 날짜, 초성, 검증, Realtime, 교사 API
  pages/        번호 선택, 학생, 교사 페이지
  styles/       전역 CSS
  types/        앱/DB 타입
supabase/
  schema.sql
  functions/teacher-actions/index.ts
```

## 실행 방법

```bash
npm install
cp .env.example .env
npm run dev
```

`.env`에 Supabase 값을 입력합니다.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase 설정

1. Supabase 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase/schema.sql` 전체를 실행합니다.
3. Database > Replication에서 `rounds`, `entries`가 Realtime publication에 포함되어 있는지 확인합니다.
4. Edge Function을 배포합니다.

```bash
supabase functions deploy teacher-actions
supabase functions deploy student-actions
```

## 데이터베이스

- `rounds`: 날짜별 주제
- `entries`: 학생 제출 낱말
- `teacher_sessions`: 교사 세션 토큰

제약 조건:

- 학생 번호는 1~23
- 초성은 14개만 허용
- 같은 날짜 같은 학생 1회만 제출
- 같은 날짜 같은 초성 1개만 제출

## Vercel 배포

1. GitHub 저장소를 Vercel에 연결합니다.
2. Framework Preset은 Vite를 선택합니다.
3. Environment Variables에 아래 값을 추가합니다.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Build Command는 `npm run build`, Output Directory는 `dist`를 사용합니다.
5. 교사용 화면은 숨겨진 0번 선택으로 입장합니다.

## 향후 확장 아이디어

- 주제 템플릿 묶음 관리
- 학생별 닉네임 또는 모둠 색상
- 교사용 PDF/CSV 기록 내보내기
- 학급별 방 코드
- 더 정교한 부적절 낱말 필터
