import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { rmSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = '/tmp/devtask-core-test';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
execSync(
  `npx -p typescript tsc src/core/dates.ts src/core/schedule.ts src/types/models.ts --ignoreConfig --outDir ${out} --module commonjs --target es2020 --esModuleInterop --skipLibCheck`,
  { cwd: root, stdio: 'inherit' }
);

const dates = await import(path.join(out, 'core/dates.js'));
const schedule = await import(path.join(out, 'core/schedule.js'));

test('addPeriod adds days and weeks from local midnight', () => {
  const base = new Date(2026, 8, 15, 14, 30);
  assert.equal(dates.addPeriod(base, 2, 'days').getDate(), 17);
  assert.equal(dates.addPeriod(base, 1, 'week').getDate(), 22);
  assert.equal(dates.addPeriod(base, 0, 'days').getHours(), 0);
});

test('addPeriod clamps month-end dates', () => {
  const jan31 = new Date(2026, 0, 31);
  const result = dates.addPeriod(jan31, 1, 'month');
  assert.equal(result.getFullYear(), 2026);
  assert.equal(result.getMonth(), 1);
  assert.equal(result.getDate(), 28);
});

test('postponement shifts effective date but not deadline', () => {
  const task = {
    triggerAt: new Date(2026, 8, 17).toISOString(),
    deadlineAt: new Date(2026, 8, 24).toISOString(),
    status: 'todo'
  };
  const result = dates.computeTaskDates(task, new Date(2026, 8, 18), [
    { id: 'p1', taskId: 't1', fromDate: new Date(2026, 8, 17).toISOString(), toDate: new Date(2026, 8, 20).toISOString(), createdAt: new Date().toISOString() }
  ]);
  assert.equal(result.effectiveDate.getDate(), 20);
  assert.equal(result.deadlineAt.getDate(), 24);
  assert.equal(result.isDueToday, false);
  assert.equal(result.isUpcoming, true);
});

test('overdue tasks stay active and expose days overdue', () => {
  const task = {
    triggerAt: new Date(2026, 8, 10).toISOString(),
    deadlineAt: new Date(2026, 8, 16).toISOString(),
    status: 'todo'
  };
  const result = dates.computeTaskDates(task, new Date(2026, 8, 18), []);
  assert.equal(result.isOverdue, true);
  assert.equal(result.daysOverdue, 2);
  assert.equal(result.isDueToday, true);
});

test('today sections sort overdue before today and upcoming', () => {
  const projects = [{ id: 'p1', title: 'Sadah', createdAt: '', deadlineValue: 1, deadlineUnit: 'month', deadlineAt: '', updatedAt: '' }];
  const tasks = [
    { id: 'upcoming', projectId: 'p1', title: 'Later', status: 'todo', priority: 'low', createdAt: '', triggerValue: 3, triggerUnit: 'days', triggerAt: new Date(2026, 8, 21).toISOString(), deadlineValue: 1, deadlineUnit: 'week', deadlineAt: new Date(2026, 8, 28).toISOString(), estimatedMinutes: 60, updatedAt: '' },
    { id: 'today', projectId: 'p1', title: 'Today', status: 'todo', priority: 'medium', createdAt: '', triggerValue: 0, triggerUnit: 'days', triggerAt: new Date(2026, 8, 18).toISOString(), deadlineValue: 2, deadlineUnit: 'days', deadlineAt: new Date(2026, 8, 20).toISOString(), estimatedMinutes: 30, updatedAt: '' },
    { id: 'overdue', projectId: 'p1', title: 'Overdue', status: 'todo', priority: 'high', createdAt: '', triggerValue: 0, triggerUnit: 'days', triggerAt: new Date(2026, 8, 15).toISOString(), deadlineValue: 1, deadlineUnit: 'day', deadlineAt: new Date(2026, 8, 17).toISOString(), estimatedMinutes: 45, updatedAt: '' }
  ];
  const sections = schedule.buildTodaySections(tasks, projects, [], { deadlineWarningDays: 2 }, new Date(2026, 8, 18));
  assert.equal(sections.overdue[0].id, 'overdue');
  assert.equal(sections.today[0].id, 'today');
  assert.equal(sections.upcoming[0].id, 'upcoming');
  assert.equal(sections.plannedMinutes, 75);
});
