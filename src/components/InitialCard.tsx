import { Check, Pencil, Trash2, X } from 'lucide-react';
import { FormEvent } from 'react';
import { getStudentColor } from '../lib/colors';
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
};

type InitialCardProps = {
  initial: Initial;
  entry?: Entry;
  selected?: boolean;
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
  disabled,
  editableEntryId,
  teacherMode,
  inlineEditor,
  onSelect,
  onDelete,
}: InitialCardProps) {
  const isFilled = Boolean(entry);
  const canSelect = Boolean(onSelect) && !disabled && (!entry || entry.id === editableEntryId);
  const style = entry ? { borderColor: getStudentColor(entry.student_number) } : undefined;

  function handleEditorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    inlineEditor?.onSubmit();
  }

  return (
    <article className={`initial-card ${isFilled ? 'filled' : 'empty'} ${selected ? 'selected' : ''}`} style={style}>
      {selected && inlineEditor ? (
        <div className="initial-card-main inline-card-editor">
          <span className="initial-letter">{initial}</span>
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
                onChange={(event) => inlineEditor.onWordChange(event.target.value)}
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
        <button type="button" className="initial-card-main" onClick={() => onSelect?.(initial)} disabled={!canSelect}>
          <span className="initial-letter">{initial}</span>
          {entry ? (
            <span className="entry-content">
              <span className="word-line">{entry.word}</span>
              <span className="entry-meta">
                <StudentBadge studentNumber={entry.student_number} />
                {canSelect ? (
                  <span className="edit-mark" aria-hidden="true">
                    <Pencil size={16} />
                  </span>
                ) : null}
              </span>
            </span>
          ) : (
            <span className="empty-mark" aria-hidden="true">
              +
            </span>
          )}
        </button>
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
