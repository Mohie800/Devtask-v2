import { PeriodUnit, Task, TaskPostponement } from '../types/models';

export interface ComputedTaskDates {
  startAt: Date;
  deadlineAt: Date;
  effectiveDate: Date;
  isOverdue: boolean;
  daysOverdue: number;
  isDueToday: boolean;
  isUpcoming: boolean;
  isApproachingDeadline: boolean;
}

export function startOfDay(input: Date | string) {
  const date = typeof input === 'string' ? new Date(input) : new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(input: Date | string) {
  const date = startOfDay(input);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function toIsoDate(input: Date) {
  return startOfDay(input).toISOString();
}

export function normalizeUnit(unit: PeriodUnit): 'day' | 'week' | 'month' {
  if (unit.startsWith('day')) return 'day';
  if (unit.startsWith('week')) return 'week';
  return 'month';
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function addPeriod(base: Date | string, value: number, unit: PeriodUnit) {
  const date = startOfDay(base);
  const kind = normalizeUnit(unit);

  if (kind === 'day') {
    date.setDate(date.getDate() + value);
    return date;
  }

  if (kind === 'week') {
    date.setDate(date.getDate() + value * 7);
    return date;
  }

  const originalDay = date.getDate();
  const targetMonthIndex = date.getMonth() + value;
  const targetYear = date.getFullYear() + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const clampedDay = Math.min(originalDay, daysInMonth(targetYear, normalizedMonth));
  return new Date(targetYear, normalizedMonth, clampedDay);
}

export function diffCalendarDays(from: Date | string, to: Date | string) {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function latestPostponementDate(postponements: TaskPostponement[] = []) {
  if (!postponements.length) return null;
  return postponements
    .map((item) => startOfDay(item.toDate))
    .sort((a, b) => b.getTime() - a.getTime())[0];
}

export function maxDate(a: Date, b: Date) {
  return a.getTime() >= b.getTime() ? a : b;
}

export function computeTaskDates(
  task: Pick<
    Task,
    'triggerAt' | 'deadlineAt' | 'status'
  >,
  todayInput: Date | string = new Date(),
  postponements: TaskPostponement[] = [],
  deadlineWarningDays = 2
): ComputedTaskDates {
  const today = startOfDay(todayInput);
  const startAt = startOfDay(task.triggerAt);
  const deadlineAt = startOfDay(task.deadlineAt);
  const postponedTo = latestPostponementDate(postponements);
  const effectiveDate = postponedTo ? maxDate(startAt, postponedTo) : startAt;
  const daysOverdue = Math.max(0, diffCalendarDays(deadlineAt, today));
  const isDone = task.status === 'done';
  const isOverdue = !isDone && today.getTime() > deadlineAt.getTime();
  const isDueToday = !isDone && effectiveDate.getTime() <= today.getTime();
  const isUpcoming = !isDone && effectiveDate.getTime() > today.getTime();
  const daysUntilDeadline = diffCalendarDays(today, deadlineAt);
  const isApproachingDeadline =
    !isDone && !isOverdue && daysUntilDeadline >= 0 && daysUntilDeadline <= deadlineWarningDays;

  return {
    startAt,
    deadlineAt,
    effectiveDate,
    isOverdue,
    daysOverdue,
    isDueToday,
    isUpcoming,
    isApproachingDeadline
  };
}

export function compareTasksByUrgency(
  a: ComputedTaskDates & { priorityScore?: number },
  b: ComputedTaskDates & { priorityScore?: number }
) {
  if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
  if (a.isDueToday !== b.isDueToday) return a.isDueToday ? -1 : 1;
  if (a.isApproachingDeadline !== b.isApproachingDeadline) return a.isApproachingDeadline ? -1 : 1;
  const deadlineDiff = a.deadlineAt.getTime() - b.deadlineAt.getTime();
  if (deadlineDiff !== 0) return deadlineDiff;
  return (b.priorityScore ?? 0) - (a.priorityScore ?? 0);
}
