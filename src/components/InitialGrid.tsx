import { INITIALS } from '../lib/initials';
import type { Entry, Initial } from '../types/app';
import { InitialCard } from './InitialCard';

type InitialGridProps = {
  entries: Entry[];
  selectedInitial?: Initial | null;
  celebrationInitial?: Initial | null;
  disabled?: boolean;
  editableEntryId?: string;
  inlineEditor?: {
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
  teacherMode?: boolean;
  onSelect?: (initial: Initial) => void;
  onDelete?: (entryId: string) => void;
};

export function InitialGrid({
  entries,
  selectedInitial,
  celebrationInitial,
  disabled,
  editableEntryId,
  inlineEditor,
  teacherMode,
  onSelect,
  onDelete,
}: InitialGridProps) {
  const entriesByInitial = new Map(entries.map((entry) => [entry.initial, entry]));

  return (
    <section className="initial-grid" aria-label="초성 낱말판">
      {INITIALS.map((initial) => (
        <InitialCard
          key={initial}
          initial={initial}
          entry={entriesByInitial.get(initial)}
          selected={selectedInitial === initial}
          celebrating={celebrationInitial === initial}
          disabled={disabled}
          editableEntryId={editableEntryId}
          inlineEditor={selectedInitial === initial ? inlineEditor : undefined}
          teacherMode={teacherMode}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
}
