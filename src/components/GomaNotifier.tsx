import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent, PointerEvent } from 'react';
import { getInitialLabel } from '../lib/initials';
import type { Entry, Initial, WordQuiz } from '../types/app';

const GOMA_VIEWPORT_PADDING = 12;
const DRAG_THRESHOLD = 4;
const SPEECH_HIDE_DELAY_MS = 4500;

type GomaNotifierProps = {
  remainingCount: number;
  selectedInitial: Initial | null;
  submittedEntry?: Entry;
  submitMessage?: string;
  wordQuiz?: WordQuiz | null;
  quizFeedback?: 'correct' | 'incorrect' | null;
  isLoading?: boolean;
  loadError?: string;
  complete?: boolean;
};

type GomaPosition = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  moved: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getObjectParticle(word: string): '을' | '를' {
  const trimmedWord = word.trim();
  const lastCharacter = trimmedWord[trimmedWord.length - 1];
  if (!lastCharacter) {
    return '를';
  }

  const code = lastCharacter.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) {
    return '를';
  }

  return (code - 0xac00) % 28 === 0 ? '를' : '을';
}

function clampPosition(position: GomaPosition, element?: HTMLElement | null, dragHandle?: HTMLElement | null): GomaPosition {
  const elementRect = element?.getBoundingClientRect();
  const handleRect = dragHandle?.getBoundingClientRect();
  const handleOffsetX = elementRect && handleRect ? handleRect.left - elementRect.left : 0;
  const handleOffsetY = elementRect && handleRect ? handleRect.top - elementRect.top : 0;
  const width = handleRect?.width ?? element?.offsetWidth ?? 0;
  const height = handleRect?.height ?? element?.offsetHeight ?? 0;
  const minX = GOMA_VIEWPORT_PADDING - handleOffsetX;
  const minY = GOMA_VIEWPORT_PADDING - handleOffsetY;
  const maxX = Math.max(minX, window.innerWidth - handleOffsetX - width - GOMA_VIEWPORT_PADDING);
  const maxY = Math.max(minY, window.innerHeight - handleOffsetY - height - GOMA_VIEWPORT_PADDING);

  return {
    x: clamp(position.x, minX, maxX),
    y: clamp(position.y, minY, maxY),
  };
}

export function GomaNotifier({
  remainingCount,
  selectedInitial,
  submittedEntry,
  submitMessage,
  wordQuiz,
  quizFeedback,
  isLoading,
  loadError,
  complete,
}: GomaNotifierProps) {
  const messages = useMemo(() => {
    const selectedInitialLabel = selectedInitial ? getInitialLabel(selectedInitial) : null;
    const submittedInitialLabel = submittedEntry ? getInitialLabel(submittedEntry.initial) : null;

    if (loadError) {
      return [
        '앗, 낱말판을 못 불러왔어. 잠시 뒤에 다시 봐 줘.',
        '연결이 잠깐 삐끗했나 봐. 조금만 기다려 보자.',
        '낱말판이 아직 준비 중일 수도 있어.',
      ];
    }

    if (isLoading) {
      return ['오늘의 낱말판을 살펴보고 있어.', '친구들이 적은 낱말을 불러오는 중이야.', '잠깐만 기다려 줘. 고마가 확인하고 있어.'];
    }

    if (submitMessage) {
      return [
        submitMessage,
        '초성과 낱말이 잘 맞는지 다시 확인해 볼까?',
        '괜찮아. 한 번 더 생각하면 더 좋은 낱말이 떠오를 거야.',
        '주제와 어울리는 낱말인지 천천히 다시 봐 줘.',
      ];
    }

    if (quizFeedback === 'correct' && wordQuiz) {
      return [
        `좋아, ${wordQuiz.answer}${getObjectParticle(wordQuiz.answer)} 정확히 맞혔어.`,
        '뜻과 예문까지 함께 보면 낱말이 더 오래 기억돼.',
        '정답을 맞힌 뒤에는 그 낱말로 짧은 문장을 만들어 봐.',
        `${wordQuiz.answer}와 비슷한 뜻을 가진 말도 떠올려 볼까?`,
        '초성, 뜻, 예문을 연결해서 생각한 게 아주 좋아.',
        '새 낱말을 알게 됐으니 오늘 주제와도 이어 봐.',
      ];
    }

    if (quizFeedback === 'incorrect' && wordQuiz) {
      return [
        `초성 ${wordQuiz.initial_hint}를 다시 천천히 읽어 봐.`,
        '뜻과 예문을 함께 보면 정답에 더 가까워질 수 있어.',
        '예문의 빈칸에 들어가도 자연스러운 낱말인지 확인해 봐.',
        '첫 생각이 틀려도 괜찮아. 단서가 하나 더 생긴 거야.',
        '정답 낱말의 글자 수와 초성을 같이 살펴봐.',
        '뜻을 소리 내어 읽고 어울리는 낱말을 떠올려 봐.',
      ];
    }

    if (complete) {
      return [
        '모든 칸이 채워졌어!',
        '친구들이 만든 낱말을 같이 읽어 봐.',
        '함께 생각하면 혼자서는 못 찾던 답도 보여.',
        '우리 반 낱말판이 완성됐어. 정말 멋지다.',
        '이제 어떤 낱말이 가장 재미있는지 찾아볼까?',
        '서로 다른 생각이 모이니까 낱말판이 꽉 찼어.',
        '완성된 낱말판을 보면서 새로 배운 낱말을 골라 봐.',
      ];
    }

    if (submittedEntry) {
      return [
        `${submittedInitialLabel} ${submittedEntry.word}, 잘 등록됐어.`,
        '이미 낱말을 등록했어. 다른 친구에게 힌트를 줘 봐.',
        `아직 ${remainingCount}개가 남았어. 친구들이 떠올릴 수 있게 응원해 줘.`,
        '좋은 힌트는 답을 알려 주기보다 생각할 문을 열어 줘.',
        '네가 찾은 낱말 하나가 우리 반 낱말판을 더 풍성하게 만들어.',
        '친구가 막혀 있으면 첫 소리나 특징을 살짝 알려 줘.',
        '답을 바로 말하지 말고 떠올릴 수 있는 단서를 줘 봐.',
        '친구들이 쓴 낱말을 보면서 비슷한 낱말도 생각해 봐.',
        '네 낱말은 등록됐으니까 이제 낱말 탐정처럼 도와줘.',
        '다른 친구가 고른 초성에도 재미있는 낱말이 숨어 있을 거야.',
        '힌트를 줄 때는 주제와 연결되는 말로 알려 주면 좋아.',
        '친구의 생각을 기다려 주는 것도 좋은 도움이야.',
        '완성까지 조금 남았어. 우리 반이 같이 채워 보자.',
      ];
    }

    if (selectedInitial) {
      return [
        `${selectedInitialLabel}로 시작하는 낱말을 생각해 봐.`,
        `지금 현재 ${remainingCount}개 남았어.`,
        '떠오른 낱말이 주제와 맞는지도 확인해 봐.',
        '천천히 생각한 낱말일수록 오래 기억에 남아.',
        '좋은 답은 빠른 손보다 차분한 생각에서 나와.',
        `${selectedInitialLabel} 소리를 입으로 작게 말해 보면 낱말이 떠오를 수 있어.`,
        '주제에서 볼 수 있는 것, 들을 수 있는 것, 떠오르는 것을 생각해 봐.',
        '너무 어려우면 주변 친구들이 쓴 낱말을 살짝 참고해 봐.',
        '짧은 낱말도 괜찮아. 주제와 맞으면 좋은 답이야.',
        '처음 떠오른 낱말을 적기 전에 한 번만 더 확인해 봐.',
        '비슷한 낱말 말고 아직 없는 새로운 낱말이면 더 좋아.',
        '머릿속에 그림을 그리면 낱말이 더 잘 떠올라.',
        '지금 생각하는 낱말이 초성으로 시작하는지 확인해 봐.',
        '고민하는 시간도 낱말을 찾는 중요한 시간이야.',
      ];
    }

    return [
      `지금 현재 ${remainingCount}개 남았어.`,
      wordQuiz ? `낱말 퀴즈 초성은 ${wordQuiz.initial_hint}야. 뜻과 예문을 같이 봐.` : '빈 칸을 눌러 초성을 고르고 낱말을 등록해 줘.',
      wordQuiz ? '퀴즈가 막히면 예문의 빈칸에 낱말을 넣어 읽어 봐.' : '친구들이 아직 쓰지 않은 낱말을 찾아 봐.',
      wordQuiz ? '뜻은 낱말의 중심이고, 예문은 낱말이 쓰이는 자리야.' : '작은 생각 하나가 모두의 배움을 크게 만들어.',
      '빈 칸을 눌러 초성을 고르고 낱말을 등록해 줘.',
      '친구들이 아직 쓰지 않은 낱말을 찾아 봐.',
      '작은 생각 하나가 모두의 배움을 크게 만들어.',
      '모르는 순간은 틀린 순간이 아니라 새로 배우는 순간이야.',
      '어떤 초성이 비어 있는지 먼저 살펴봐.',
      '쉬워 보이는 초성부터 골라도 좋아.',
      '아직 비어 있는 칸에 네 생각을 하나 더해 줘.',
      '주제를 떠올리고 그 안에 있는 낱말을 찾아 봐.',
      '친구와 같은 낱말 말고 새로운 낱말을 발견해 봐.',
      '생각이 안 나면 주제를 몸짓이나 그림처럼 떠올려 봐.',
      '한 글자씩 천천히 떠올리면 낱말이 가까워져.',
      '오늘의 주제와 어울리는 낱말을 고르는 게 중요해.',
      '빈 칸은 아직 기다리고 있어. 네 낱말을 들려줘.',
      '정답은 하나만 있는 게 아니야. 다양한 낱말을 찾아 봐.',
      '처음 떠오른 생각도 소중해. 한번 적어 볼까?',
      '우리 반 낱말판에 네 아이디어를 붙여 줘.',
    ];
  }, [complete, isLoading, loadError, quizFeedback, remainingCount, selectedInitial, submitMessage, submittedEntry, wordQuiz]);

  const [messageIndex, setMessageIndex] = useState(0);
  const [isSpeechVisible, setIsSpeechVisible] = useState(true);
  const [position, setPosition] = useState<GomaPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const notifierRef = useRef<HTMLElement | null>(null);
  const gomaButtonRef = useRef<HTMLButtonElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const messageSignature = messages.join('\n');
  const currentMessage = messages[messageIndex] ?? '';

  useEffect(() => {
    setMessageIndex(0);
    setIsSpeechVisible(true);
  }, [messageSignature]);

  useEffect(() => {
    if (!isSpeechVisible) {
      return undefined;
    }

    const hideTimerId = window.setTimeout(() => {
      setIsSpeechVisible(false);
    }, SPEECH_HIDE_DELAY_MS);

    return () => {
      window.clearTimeout(hideTimerId);
    };
  }, [currentMessage, isSpeechVisible]);

  useEffect(() => {
    function handleResize() {
      setPosition((currentPosition) => {
        if (!currentPosition) {
          return currentPosition;
        }

        return clampPosition(currentPosition, notifierRef.current, gomaButtonRef.current);
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function handleGomaPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) {
      return;
    }

    const notifier = notifierRef.current;

    if (!notifier) {
      return;
    }

    const rect = notifier.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    setPosition({ x: rect.left, y: rect.top });
    setIsDragging(true);
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleGomaPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const distanceX = Math.abs(event.clientX - dragState.startX);
    const distanceY = Math.abs(event.clientY - dragState.startY);

    if (distanceX > DRAG_THRESHOLD || distanceY > DRAG_THRESHOLD) {
      dragState.moved = true;
    }

    setPosition(clampPosition({
      x: event.clientX - dragState.offsetX,
      y: event.clientY - dragState.offsetY,
    }, notifierRef.current, gomaButtonRef.current));
  }

  function finishGomaDrag(event: PointerEvent<HTMLButtonElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (dragState.moved) {
      suppressClickRef.current = true;
      setPosition((currentPosition) => {
        const nextPosition = currentPosition ? clampPosition(currentPosition, notifierRef.current, gomaButtonRef.current) : currentPosition;

        return nextPosition;
      });
    }

    dragStateRef.current = null;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleGomaClick(event: MouseEvent<HTMLButtonElement>) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.preventDefault();
      return;
    }

    if (messages.length > 1) {
      setMessageIndex((currentIndex) => (currentIndex + 1) % messages.length);
    }
    setIsSpeechVisible(true);
  }

  const notifierStyle: CSSProperties | undefined = position
    ? {
        left: position.x,
        top: position.y,
        right: 'auto',
        bottom: 'auto',
      }
    : undefined;

  return (
    <aside ref={notifierRef} className={`goma-notifier ${isDragging ? 'dragging' : ''}`} style={notifierStyle} aria-label="고마 알림">
      {isSpeechVisible ? (
        <div className="goma-speech" role="status" aria-live="polite">
          <i className="goma-speech-stitch" aria-hidden="true" />
          <span className="goma-speech-text">{currentMessage}</span>
        </div>
      ) : (
        <div className="goma-speech-placeholder" aria-hidden="true" />
      )}
      <button
        ref={gomaButtonRef}
        type="button"
        className="goma-button"
        onPointerDown={handleGomaPointerDown}
        onPointerMove={handleGomaPointerMove}
        onPointerUp={finishGomaDrag}
        onPointerCancel={finishGomaDrag}
        onClick={handleGomaClick}
        aria-label="고마에게 말 걸기"
      >
        <img className="goma-character" src="/goma-character.png" alt="" />
      </button>
    </aside>
  );
}
