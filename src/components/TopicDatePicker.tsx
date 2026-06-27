import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getDateKey, parseDateKey } from '../lib/date';

type TopicDatePickerProps = {
  selectedDate: string;
  todayDate: string;
  topicDates: string[];
  onDateChange: (date: string) => void;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function getMonthLabel(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function getCalendarDays(monthDate: Date): Date[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + index));
}

export function TopicDatePicker({ selectedDate, todayDate, topicDates, onDateChange }: TopicDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => parseDateKey(selectedDate));
  const rootRef = useRef<HTMLDivElement>(null);
  const topicDateSet = useMemo(() => new Set(topicDates), [topicDates]);
  const calendarDays = useMemo(() => getCalendarDays(viewMonth), [viewMonth]);

  useEffect(() => {
    setViewMonth(parseDateKey(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  function moveMonth(offset: number) {
    setViewMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  }

  function selectDate(dateKey: string) {
    onDateChange(dateKey);
    setIsOpen(false);
  }

  return (
    <div className="topic-date-picker" ref={rootRef}>
      <button
        type="button"
        className="teacher-date-control"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Calendar size={18} aria-hidden="true" />
        <span>{selectedDate}</span>
      </button>

      {isOpen ? (
        <section className="topic-calendar" role="dialog" aria-label="날짜 선택">
          <div className="topic-calendar-header">
            <strong>{getMonthLabel(viewMonth)}</strong>
            <div className="topic-calendar-nav">
              <button type="button" onClick={() => moveMonth(-1)} aria-label="이전 달">
                <ChevronLeft size={22} />
              </button>
              <button type="button" onClick={() => moveMonth(1)} aria-label="다음 달">
                <ChevronRight size={22} />
              </button>
            </div>
          </div>

          <div className="topic-calendar-grid topic-calendar-weekdays">
            {WEEKDAYS.map((weekday) => (
              <div key={weekday}>{weekday}</div>
            ))}
          </div>

          <div className="topic-calendar-grid">
            {calendarDays.map((date) => {
              const dateKey = getDateKey(date);
              const isCurrentMonth = date.getMonth() === viewMonth.getMonth();
              const isSelected = dateKey === selectedDate;
              const isToday = dateKey === todayDate;
              const hasTopic = topicDateSet.has(dateKey);

              return (
                <button
                  type="button"
                  key={dateKey}
                  className={[
                    'topic-calendar-day',
                    isCurrentMonth ? '' : 'outside-month',
                    isSelected ? 'selected' : '',
                    isToday ? 'today' : '',
                    hasTopic ? 'has-topic' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => selectDate(dateKey)}
                  aria-label={`${dateKey}${hasTopic ? ', 주제 있음' : ''}`}
                >
                  <span>{date.getDate()}</span>
                  {hasTopic ? <i aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>

          <div className="topic-calendar-footer">
            <span>
              <i aria-hidden="true" />
              주제 있음
            </span>
            <button type="button" onClick={() => selectDate(todayDate)}>
              오늘
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
