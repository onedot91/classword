import type { Entry, Initial, Round, StudentNumber } from '../types/app';

const LOCAL_ROUNDS_KEY = 'classword_local_rounds';
const LOCAL_ENTRIES_KEY = 'classword_local_entries';
export const LOCAL_BOARD_EVENT = 'classword-local-board-change';

type LocalEntry = Entry;

function readJson<T>(key: string, fallback: T): T {
  const rawValue = localStorage.getItem(key);
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(LOCAL_BOARD_EVENT));
}

function makeId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getLocalRound(date: string): Round | null {
  const rounds = readJson<Round[]>(LOCAL_ROUNDS_KEY, []);
  return rounds.find((round) => round.round_date === date) ?? null;
}

export function upsertLocalRound(date: string, topic: string): Round {
  const rounds = readJson<Round[]>(LOCAL_ROUNDS_KEY, []);
  const now = new Date().toISOString();
  const existingIndex = rounds.findIndex((round) => round.round_date === date);

  if (existingIndex >= 0) {
    const nextRound = { ...rounds[existingIndex], topic, updated_at: now };
    rounds[existingIndex] = nextRound;
    writeJson(LOCAL_ROUNDS_KEY, rounds);
    return nextRound;
  }

  const round: Round = {
    id: makeId(),
    round_date: date,
    topic,
    created_at: now,
    updated_at: now,
  };
  rounds.push(round);
  writeJson(LOCAL_ROUNDS_KEY, rounds);
  return round;
}

export function getLocalEntries(date: string): Entry[] {
  return readJson<LocalEntry[]>(LOCAL_ENTRIES_KEY, [])
    .filter((entry) => entry.round_date === date)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function insertLocalEntry(date: string, initial: Initial, word: string, studentNumber: StudentNumber): Entry {
  upsertLocalRound(date, getLocalRound(date)?.topic ?? '');

  const entries = readJson<LocalEntry[]>(LOCAL_ENTRIES_KEY, []);
  if (entries.some((entry) => entry.round_date === date && entry.student_number === studentNumber)) {
    throw new Error('오늘은 한 번만 제출할 수 있어요.');
  }

  if (entries.some((entry) => entry.round_date === date && entry.initial === initial)) {
    throw new Error('이미 채워진 칸이에요.');
  }

  const entry: Entry = {
    id: makeId(),
    round_date: date,
    initial,
    word,
    student_number: studentNumber,
    is_mvp: false,
    created_at: new Date().toISOString(),
  };

  entries.push(entry);
  writeJson(LOCAL_ENTRIES_KEY, entries);
  return entry;
}

export function updateLocalEntry(entryId: string, initial: Initial, word: string): Entry {
  const entries = readJson<LocalEntry[]>(LOCAL_ENTRIES_KEY, []);
  const index = entries.findIndex((entry) => entry.id === entryId);
  if (index < 0) {
    throw new Error('수정할 낱말을 찾을 수 없어요.');
  }

  const currentEntry = entries[index];
  const occupiedByOther = entries.some(
    (entry) => entry.round_date === currentEntry.round_date && entry.initial === initial && entry.id !== entryId,
  );

  if (occupiedByOther) {
    throw new Error('이미 채워진 칸이에요.');
  }

  entries[index] = { ...currentEntry, initial, word };
  writeJson(LOCAL_ENTRIES_KEY, entries);
  return entries[index];
}

export function deleteLocalEntry(entryId: string): void {
  const entries = readJson<LocalEntry[]>(LOCAL_ENTRIES_KEY, []);
  writeJson(
    LOCAL_ENTRIES_KEY,
    entries.filter((entry) => entry.id !== entryId),
  );
}
