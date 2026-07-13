import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const missionUtils = readFileSync(new URL('../api/mission-utils.ts', import.meta.url), 'utf8');

test('mission param validation enforces student, date format, date order, and 7-day max', () => {
  assert.match(missionUtils, /getStudentNumber\(studentNumberValue\)/);
  assert.equal(missionUtils.includes('const DATE_PATTERN = /^\\d{4}-\\d{2}-\\d{2}$/;'), true);
  assert.match(missionUtils, /start\.getTime\(\) > end\.getTime\(\)/);
  assert.match(missionUtils, /MAX_RANGE_DAYS = 7/);
  assert.match(missionUtils, /rangeDays > MAX_RANGE_DAYS/);
});

test('mission status builder returns sorted dates by event type and filters mixed student rows', () => {
  assert.match(missionUtils, /wordEntryDates: \[\.\.\.wordEntryDates\]\.sort\(\)/);
  assert.match(missionUtils, /quizCorrectDates: \[\.\.\.quizCorrectDates\]\.sort\(\)/);
  assert.match(missionUtils, /rowStudentNumber && rowStudentNumber !== studentNumber/);
  assert.doesNotMatch(missionUtils, /word:/);
  assert.doesNotMatch(missionUtils, /answer:/);
});
