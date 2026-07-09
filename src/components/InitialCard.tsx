import { Check, Trash2, X } from 'lucide-react';
import { FormEvent, KeyboardEvent, useEffect } from 'react';
import { getStudentColor } from '../lib/colors';
import { getInitialLabel } from '../lib/initials';
import { sanitizeWordInput } from '../lib/validation';
import type { Entry, Initial } from '../types/app';
import { StudentBadge } from './StudentBadge';

type InlineEditorProps = {
  word: string;
  pendingWord: string;
  message: string;
  submitLabel: string;
  isSubmitting: boolean;
  onWordChange: (word: string) => void;
  onSubmit: () => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
  onCancel: () => void;
};

type InitialCardProps = {
  initial: Initial;
  entry?: Entry;
  selected?: boolean;
  celebrating?: boolean;
  disabled?: boolean;
  editableEntryId?: string;
  teacherMode?: boolean;
  inlineEditor?: InlineEditorProps;
  onSelect?: (initial: Initial) => void;
  onDelete?: (entryId: string) => void;
};

export function InitialCard({
  initial,
  entry,
  selected,
  celebrating,
  disabled,
  editableEntryId,
  teacherMode,
  inlineEditor,
  onSelect,
  onDelete,
}: InitialCardProps) {
  const isFilled = Boolean(entry);
  const canSelect = Boolean(onSelect) && !disabled && (!entry || entry.id === editableEntryId);
  const canDeleteEntry = Boolean(onDelete && entry?.id === editableEntryId);
  const style = entry ? { borderColor: getStudentColor(entry.student_number) } : undefined;
  const initialLabel = getInitialLabel(initial);

  useEffect(() => {
    if (!selected || !inlineEditor?.pendingWord) {
      return undefined;
    }

    function handleWindowKeyDown(event: globalThis.KeyboardEvent) {
      if (!inlineEditor || inlineEditor.isSubmitting || event.repeat) {
        return;
      }

      if (event.target instanceof HTMLElement && event.target.closest('button')) {
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        inlineEditor.onConfirm();
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        inlineEditor.onCancelConfirm();
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [inlineEditor, selected]);

  function handleEditorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    inlineEditor?.onSubmit();
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!canSelect || (event.key !== 'Enter' && event.key !== ' ')) {
      return;
    }

    event.preventDefault();
    onSelect?.(initial);
  }

  return (
    <article className={`initial-card ${isFilled ? 'filled' : 'empty'} ${selected ? 'selected' : ''} ${celebrating ? 'celebrating' : ''}`} style={style}>
      {selected && inlineEditor ? (
        <div className={`initial-card-main inline-card-editor ${inlineEditor.pendingWord ? 'confirming' : ''}`}>
          {!inlineEditor.pendingWord ? (
            <button
              type="button"
              className="card-cancel-button"
              onClick={inlineEditor.onCancel}
              disabled={inlineEditor.isSubmitting}
              aria-label="입력 취소"
            >
              <X size={18} />
            </button>
          ) : null}
          <span className="initial-letter">{initialLabel}</span>
          {inlineEditor.pendingWord ? (
            <div className="card-confirm">
              <strong>{inlineEditor.pendingWord}</strong>
              <span>맞나요?</span>
              <div className="card-confirm-actions">
                <button type="button" onClick={inlineEditor.onConfirm} disabled={inlineEditor.isSubmitting} aria-label="확인">
                  <Check size={22} />
                </button>
                <button type="button" onClick={inlineEditor.onCancelConfirm} disabled={inlineEditor.isSubmitting} aria-label="고치기">
                  <X size={22} />
                </button>
              </div>
            </div>
          ) : (
            <form className="card-input-form" onSubmit={handleEditorSubmit}>
              <input
                value={inlineEditor.word}
                onChange={(event) => inlineEditor.onWordChange(sanitizeWordInput(event.target.value))}
                placeholder="낱말"
                autoFocus
                autoComplete="off"
              />
              <button type="submit" disabled={inlineEditor.isSubmitting || !inlineEditor.word.trim()} aria-label={inlineEditor.submitLabel}>
                <Check size={22} />
              </button>
            </form>
          )}
          {inlineEditor.message ? <p className="card-message">{inlineEditor.message}</p> : null}
        </div>
      ) : (
        entry ? (
          <div
            className="initial-card-main"
            role={canSelect ? 'button' : undefined}
            tabIndex={canSelect ? 0 : undefined}
            onClick={() => {
              if (canSelect) {
                onSelect?.(initial);
              }
            }}
            onKeyDown={handleCardKeyDown}
          >
            <span className="initial-letter">{initialLabel}</span>
            <span className="entry-content">
              <span className="word-line">{entry.word}</span>
              <span className="entry-meta">
                <StudentBadge studentNumber={entry.student_number} />
                {canDeleteEntry ? (
                  <button
                    type="button"
                    className="edit-mark delete-mark"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete?.(entry.id);
                    }}
                    aria-label="삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </span>
            </span>
          </div>
        ) : (
          <button type="button" className="initial-card-main" onClick={() => onSelect?.(initial)} disabled={!canSelect}>
            <span className="initial-letter">{initialLabel}</span>
            <span className="empty-mark" aria-hidden="true">
              +
            </span>
          </button>
        )
      )}

      {teacherMode && entry ? (
        <div className="card-actions">
          <button type="button" className="icon-button danger" onClick={() => onDelete?.(entry.id)} aria-label="낱말 삭제">
            <Trash2 size={18} />
          </button>
        </div>
      ) : null}
    </article>
  );
}
