import { db } from '../database';
import { PeriodUnit, Project } from '@/types/models';
import { addPeriod } from '@/core/dates';
import { createId, nowIso } from '@/utils/id';

export interface ProjectInput {
  title: string;
  ownerId?: string | null;
  deadlineValue: number;
  deadlineUnit: PeriodUnit;
  pledgedAmount?: number | null;
  startAt?: Date;
}

export function listProjects(): Project[] {
  return db.getAllSync<Project>('SELECT * FROM projects ORDER BY updatedAt DESC');
}

export function getProject(id: string) {
  return db.getFirstSync<Project>('SELECT * FROM projects WHERE id = ?', [id]);
}

export function createProject(input: ProjectInput): Project {
  const now = nowIso();
  const startAt = input.startAt ?? new Date();
  const project: Project = {
    id: createId('project'),
    title: input.title.trim(),
    ownerId: input.ownerId ?? null,
    createdAt: now,
    deadlineValue: input.deadlineValue,
    deadlineUnit: input.deadlineUnit,
    deadlineAt: addPeriod(startAt, input.deadlineValue, input.deadlineUnit).toISOString(),
    pledgedAmount: input.pledgedAmount ?? null,
    updatedAt: now
  };

  db.runSync(
    `INSERT INTO projects (id, title, ownerId, createdAt, deadlineValue, deadlineUnit, deadlineAt, pledgedAmount, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      project.id,
      project.title,
      project.ownerId,
      project.createdAt,
      project.deadlineValue,
      project.deadlineUnit,
      project.deadlineAt,
      project.pledgedAmount,
      project.updatedAt
    ]
  );
  return project;
}

export function updateProject(id: string, patch: Partial<ProjectInput & { deadlineAt: string }>) {
  const current = getProject(id);
  if (!current) return null;
  const next: Project = {
    ...current,
    title: patch.title?.trim() ?? current.title,
    ownerId: patch.ownerId !== undefined ? patch.ownerId : current.ownerId,
    deadlineValue: patch.deadlineValue ?? current.deadlineValue,
    deadlineUnit: patch.deadlineUnit ?? current.deadlineUnit,
    deadlineAt:
      patch.deadlineAt ??
      (patch.deadlineValue !== undefined || patch.deadlineUnit !== undefined
        ? addPeriod(current.createdAt, patch.deadlineValue ?? current.deadlineValue, patch.deadlineUnit ?? current.deadlineUnit).toISOString()
        : current.deadlineAt),
    pledgedAmount: patch.pledgedAmount !== undefined ? patch.pledgedAmount : current.pledgedAmount,
    updatedAt: nowIso()
  };

  db.runSync(
    `UPDATE projects SET title = ?, ownerId = ?, deadlineValue = ?, deadlineUnit = ?, deadlineAt = ?, pledgedAmount = ?, updatedAt = ? WHERE id = ?`,
    [next.title, next.ownerId, next.deadlineValue, next.deadlineUnit, next.deadlineAt, next.pledgedAmount, next.updatedAt, id]
  );
  return getProject(id);
}

export function deleteProject(id: string) {
  db.runSync('DELETE FROM projects WHERE id = ?', [id]);
}
