import { db } from './database';
import { createId, nowIso } from '@/utils/id';

const SCHEMA_VERSION = 1;

export function migrateDatabase() {
  db.execSync('PRAGMA journal_mode = WAL;');
  db.execSync('PRAGMA foreign_keys = ON;');

  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= SCHEMA_VERSION) return;

  db.execSync(`
    CREATE TABLE IF NOT EXISTS owners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      email TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      ownerId TEXT REFERENCES owners(id) ON DELETE SET NULL,
      createdAt TEXT NOT NULL,
      deadlineValue INTEGER NOT NULL,
      deadlineUnit TEXT NOT NULL,
      deadlineAt TEXT NOT NULL,
      pledgedAmount REAL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'blocked', 'done')),
      priority TEXT NOT NULL CHECK (priority IN ('none', 'low', 'medium', 'high', 'urgent')),
      createdAt TEXT NOT NULL,
      triggerValue INTEGER NOT NULL,
      triggerUnit TEXT NOT NULL,
      triggerAt TEXT NOT NULL,
      deadlineValue INTEGER NOT NULL,
      deadlineUnit TEXT NOT NULL,
      deadlineAt TEXT NOT NULL,
      estimatedMinutes INTEGER NOT NULL,
      blockedReason TEXT,
      blockedReminderAt TEXT,
      completedAt TEXT,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_postponements (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      fromDate TEXT NOT NULL,
      toDate TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY CHECK (id = 'app'),
      notificationsEnabled INTEGER NOT NULL,
      dailyNotificationTime TEXT NOT NULL,
      eveningNotificationTime TEXT NOT NULL,
      deadlineWarningDays INTEGER NOT NULL,
      defaultTaskMinutes INTEGER NOT NULL,
      defaultPriority TEXT NOT NULL,
      themePreference TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(ownerId);
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(projectId);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_trigger ON tasks(triggerAt);
    CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadlineAt);
    CREATE INDEX IF NOT EXISTS idx_payments_project ON payments(projectId);
    CREATE INDEX IF NOT EXISTS idx_postponements_task ON task_postponements(taskId);
  `);

  const now = nowIso();
  db.runSync(
    `INSERT OR IGNORE INTO settings (
      id, notificationsEnabled, dailyNotificationTime, eveningNotificationTime,
      deadlineWarningDays, defaultTaskMinutes, defaultPriority, themePreference, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['app', 1, '09:00', '22:00', 2, 60, 'none', 'system', now, now]
  );

  db.execSync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
}

export interface RestorePayload {
  owners?: any[];
  projects?: any[];
  tasks?: any[];
  payments?: any[];
  task_postponements?: any[];
  postponements?: any[];
  settings?: any;
}

export function restoreData(payload: RestorePayload) {
  const postponements = payload.task_postponements ?? payload.postponements ?? [];
  db.withTransactionSync(() => {
    clearAllData();
    (payload.owners ?? []).forEach((owner) => {
      db.runSync(
        'INSERT INTO owners (id, name, company, phone, email, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [owner.id, owner.name, owner.company ?? null, owner.phone ?? null, owner.email ?? null, owner.notes ?? null, owner.createdAt, owner.updatedAt]
      );
    });
    (payload.projects ?? []).forEach((project) => {
      db.runSync(
        `INSERT INTO projects (id, title, ownerId, createdAt, deadlineValue, deadlineUnit, deadlineAt, pledgedAmount, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [project.id, project.title, project.ownerId ?? null, project.createdAt, project.deadlineValue, project.deadlineUnit, project.deadlineAt, project.pledgedAmount ?? null, project.updatedAt]
      );
    });
    (payload.tasks ?? []).forEach((task) => {
      db.runSync(
        `INSERT INTO tasks (
          id, projectId, title, status, priority, createdAt,
          triggerValue, triggerUnit, triggerAt,
          deadlineValue, deadlineUnit, deadlineAt,
          estimatedMinutes, blockedReason, blockedReminderAt, completedAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id, task.projectId, task.title, task.status, task.priority, task.createdAt,
          task.triggerValue, task.triggerUnit, task.triggerAt,
          task.deadlineValue, task.deadlineUnit, task.deadlineAt,
          task.estimatedMinutes, task.blockedReason ?? null, task.blockedReminderAt ?? null,
          task.completedAt ?? null, task.updatedAt
        ]
      );
    });
    (payload.payments ?? []).forEach((payment) => {
      db.runSync('INSERT INTO payments (id, projectId, amount, date, note, createdAt) VALUES (?, ?, ?, ?, ?, ?)', [payment.id, payment.projectId, payment.amount, payment.date, payment.note ?? null, payment.createdAt]);
    });
    postponements.forEach((item) => {
      db.runSync('INSERT INTO task_postponements (id, taskId, fromDate, toDate, createdAt) VALUES (?, ?, ?, ?, ?)', [item.id, item.taskId, item.fromDate, item.toDate, item.createdAt]);
    });
    if (payload.settings) {
      db.runSync(
        `UPDATE settings SET notificationsEnabled = ?, dailyNotificationTime = ?, eveningNotificationTime = ?, deadlineWarningDays = ?, defaultTaskMinutes = ?, defaultPriority = ?, themePreference = ?, updatedAt = ? WHERE id = 'app'`,
        [
          payload.settings.notificationsEnabled ? 1 : 0,
          payload.settings.dailyNotificationTime,
          payload.settings.eveningNotificationTime,
          payload.settings.deadlineWarningDays,
          payload.settings.defaultTaskMinutes,
          payload.settings.defaultPriority,
          payload.settings.themePreference,
          new Date().toISOString()
        ]
      );
    }
  });
}

export function clearAllData() {
  db.execSync(`
    DELETE FROM task_postponements;
    DELETE FROM payments;
    DELETE FROM tasks;
    DELETE FROM projects;
    DELETE FROM owners;
  `);
}
