import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync(new URL('../sql/neon-schema.sql', import.meta.url), 'utf8');
const studentActions = readFileSync(new URL('../api/student-actions.ts', import.meta.url), 'utf8');
const missionStatus = readFileSync(new URL('../api/mission-status.ts', import.meta.url), 'utf8');

test('schema creates mission event table with uniqueness and indexes', () => {
  assert.match(schema, /create table if not exists student_mission_events/);
  assert.match(schema, /event_type text not null/);
  assert.match(schema, /check \(event_type in \('word_entry', 'quiz_correct'\)\)/);
  assert.match(schema, /unique \(student_number, event_date, event_type\)/);
  assert.match(schema, /student_mission_events_student_date_idx/);
  assert.match(schema, /student_mission_events_student_type_date_idx/);
});

test('word entry success records word_entry mission event without touching deletes', () => {
  assert.match(studentActions, /recordMissionEvent\(action\.studentNumber, action\.date, 'word_entry'\)/);
  assert.match(studentActions, /on conflict \(student_number, event_date, event_type\) do nothing/);
  const deleteEntryBody = studentActions.slice(studentActions.indexOf('async function deleteEntry'), studentActions.indexOf('async function submitQuiz'));
  assert.doesNotMatch(deleteEntryBody, /student_mission_events|recordMissionEvent/);
});

test('quiz submit validates student number and records only quiz_correct success', () => {
  assert.match(studentActions, /readonly studentNumber: StudentNumber/);
  assert.match(studentActions, /const studentNumber = getStudentNumber\(body\.studentNumber\)/);
  assert.match(studentActions, /if \(correct\) \{/);
  assert.match(studentActions, /recordMissionEvent\(action\.studentNumber, action\.date, 'quiz_correct'\)/);
  const submitQuizBody = studentActions.slice(studentActions.indexOf('async function submitQuiz'), studentActions.indexOf('export default async function handler'));
  const beforeCorrectBlock = submitQuizBody.slice(0, submitQuizBody.indexOf('if (correct)'));
  assert.doesNotMatch(beforeCorrectBlock, /quiz_correct/);
});

test('mission status API is read-only, no-store, CORS-limited, and privacy preserving', () => {
  assert.match(missionStatus, /request\.method !== 'GET'/);
  assert.match(missionStatus, /Access-Control-Allow-Origin', SCHOOL_TIMER_ORIGIN/);
  assert.match(missionStatus, /https:\/\/school-timer-five\.vercel\.app/);
  assert.match(missionStatus, /Cache-Control', 'no-store'/);
  assert.match(missionStatus, /where student_number = \$\{parsed\.studentNumber\}/);
  assert.doesNotMatch(missionStatus, /word,|answer,|select \*/);
});
