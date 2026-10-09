import { db } from '../database';
import { PeriodUnit, Priority, Task, TaskPostponement, TaskStatus } from '@/types/models';
import { addPeriod, startOfDay } from '@/core/dates';
import { createId, nowIso } from '@/utils/id';

export interface TaskInput {
  projectId: string;
  title: string;
  priority?: Priority;
  triggerValue: number;
  triggerUnit: PeriodUnit;
  deadlineValue: number;
  deadlineUnit: PeriodUnit;
  estimatedMinutes: number;
  startFrom?: Date;
}

function listRows<T>(query: string, params: any[] = []) {
  return db.getAllSync<T>(query, params);
}

export function listTasks(): Task[] {
  return listRows<Task>('SELECT * FROM tasks ORDER BY deadlineAt ASC, createdAt ASC');
}

export function listTasksForProject(projectId: string) {
  return listRows<Task>('SELECT * FROM tasks WHERE projectId = ? ORDER BY deadlineAt ASC', [projectId]);
}

export function getTask(id: string) {
  return db.getFirstSync<Task>('SELECT * FROM tasks WHERE id = ?', [id]);
}

export function createTask(input: TaskInput): Task {
  const now = nowIso();
  const startFrom = startOfDay(input.startFrom ?? new Date());
  const task: Task = {
    id: createId('task'),
    projectId: input.projectId,
    title: input.title.trim(),
    status: 'todo',
    priority: input.priority ?? 'none',
    createdAt: now,
    triggerValue: input.triggerValue,
    triggerUnit: input.triggerUnit,
    triggerAt: addPeriod(startFrom, input.triggerValue, input.triggerUnit).toISOString(),
    deadlineValue: input.deadlineValue,
    deadlineUnit: input.deadlineUnit,
    deadlineAt: addPeriod(startFrom, input.deadlineValue, input.deadlineUnit).toISOString(),
    estimatedMinutes: input.estimatedMinutes,
    blockedReason: null,
    blockedReminderAt: null,
    completedAt: null,
    updatedAt: now
  };

  db.runSync(
    `INSERT INTO tasks (
      id, projectId, title, status, priority, createdAt,
      triggerValue, triggerUnit, triggerAt,
      deadlineValue, deadlineUnit, deadlineAt,
      estimatedMinutes, blockedReason, blockedReminderAt, completedAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.projectId,
      task.title,
      task.status,
      task.priority,
      task.createdAt,
      task.triggerValue,
      task.triggerUnit,
      task.triggerAt,
      task.deadlineValue,
      task.deadlineUnit,
      task.deadlineAt,
      task.estimatedMinutes,
      task.blockedReason,
      task.blockedReminderAt,
      task.completedAt,
      task.updatedAt
    ]
  );
  return task;
}

export function updateTaskSchedule(
  id: string,
  patch: Partial<Pick<Task, 'title' | 'priority' | 'estimatedMinutes' | 'triggerValue' | 'triggerUnit' | 'deadlineValue' | 'deadlineUnit' | 'triggerAt' | 'deadlineAt'>>
) {
  const current = getTask(id);
  if (!current) return null;
  const base = startOfDay(current.createdAt);
  const next: Task = {
    ...current,
    title: patch.title?.trim() ?? current.title,
    priority: patch.priority ?? current.priority,
    estimatedMinutes: patch.estimatedMinutes ?? current.estimatedMinutes,
    triggerValue: patch.triggerValue ?? current.triggerValue,
    triggerUnit: patch.triggerUnit ?? current.triggerUnit,
    deadlineValue: patch.deadlineValue ?? current.deadlineValue,
    deadlineUnit: patch.deadlineUnit ?? current.deadlineUnit,
    triggerAt:
      patch.triggerAt ??
      (patch.triggerValue !== undefined || patch.triggerUnit !== undefined
        ? addPeriod(base, patch.triggerValue ?? current.triggerValue, patch.triggerUnit ?? current.triggerUnit).toISOString()
        : current.triggerAt),
    deadlineAt:
      patch.deadlineAt ??
      (patch.deadlineValue !== undefined || patch.deadlineUnit !== undefined
        ? addPeriod(base, patch.deadlineValue ?? current.deadlineValue, patch.deadlineUnit ?? current.deadlineUnit).toISOString()
        : current.deadlineAt),
    updatedAt: nowIso()
  };

  db.runSync(
    `UPDATE tasks SET title = ?, priority = ?, estimatedMinutes = ?, triggerValue = ?, triggerUnit = ?, triggerAt = ?, deadlineValue = ?, deadlineUnit = ?, deadlineAt = ?, updatedAt = ? WHERE id = ?`,
    [next.title, next.priority, next.estimatedMinutes, next.triggerValue, next.triggerUnit, next.triggerAt, next.deadlineValue, next.deadlineUnit, next.deadlineAt, next.updatedAt, id]
  );
  return getTask(id);
}

export function setTaskStatus(id: string, status: TaskStatus) {
  const now = nowIso();
  const completedAt = status === 'done' ? now : null;
  db.runSync(
    `UPDATE tasks SET status = ?, completedAt = ?, blockedReason = CASE WHEN ? = 'blocked' THEN blockedReason ELSE NULL END, blockedReminderAt = CASE WHEN ? = 'blocked' THEN blockedReminderAt ELSE NULL END, updatedAt = ? WHERE id = ?`,
    [status, completedAt, status, status, now, id]
  );
  return getTask(id);
}

export function blockTask(id: string, reason?: string, reminderAt?: string | null) {
  db.runSync(
    `UPDATE tasks SET status = 'blocked', blockedReason = ?, blockedReminderAt = ?, completedAt = NULL, updatedAt = ? WHERE id = ?`,
    [reason ?? null, reminderAt ?? null, nowIso(), id]
  );
  return getTask(id);
}

export function unblockTask(id: string, status: TaskStatus = 'in_progress') {
  db.runSync(
    `UPDATE tasks SET status = ?, blockedReason = NULL, blockedReminderAt = NULL, completedAt = NULL, updatedAt = ? WHERE id = ?`,
    [status === 'done' ? 'in_progress' : status, nowIso(), id]
  );
  return getTask(id);
}

export function postponeTask(id: string, toDate: Date) {
  const current = getTask(id);
  if (!current) return null;
  const postponement: TaskPostponement = {
    id: createId('postpone'),
    taskId: id,
    fromDate: startOfDay(new Date()).toISOString(),
    toDate: startOfDay(toDate).toISOString(),
    createdAt: nowIso()
  };
  db.runSync(
    'INSERT INTO task_postponements (id, taskId, fromDate, toDate, createdAt) VALUES (?, ?, ?, ?, ?)',
    [postponement.id, postponement.taskId, postponement.fromDate, postponement.toDate, postponement.createdAt]
  );
  db.runSync('UPDATE tasks SET updatedAt = ? WHERE id = ?', [nowIso(), id]);
  return getTask(id);
}

export function listPostponements(): TaskPostponement[] {
  return db.getAllSync<TaskPostponement>('SELECT * FROM task_postponements ORDER BY createdAt ASC');
}

export function listPostponementsForTask(taskId: string) {
  return db.getAllSync<TaskPostponement>('SELECT * FROM task_postponements WHERE taskId = ? ORDER BY createdAt ASC', [taskId]);
}

export function deleteTask(id: string) {
  db.runSync('DELETE FROM tasks WHERE id = ?', [id]);
}
