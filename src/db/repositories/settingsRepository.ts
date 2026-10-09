import { db } from '../database';
import { Settings, ThemePreference, Priority } from '@/types/models';
import { nowIso } from '@/utils/id';

function mapSettings(row: any): Settings {
  return {
    id: 'app',
    notificationsEnabled: Boolean(row.notificationsEnabled),
    dailyNotificationTime: row.dailyNotificationTime,
    eveningNotificationTime: row.eveningNotificationTime,
    deadlineWarningDays: row.deadlineWarningDays,
    defaultTaskMinutes: row.defaultTaskMinutes,
    defaultPriority: row.defaultPriority,
    themePreference: row.themePreference,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export function getSettings(): Settings {
  const row = db.getFirstSync<any>('SELECT * FROM settings WHERE id = ?', ['app']);
  if (!row) throw new Error('Settings row missing. Run migrateDatabase() first.');
  return mapSettings(row);
}

export function updateSettings(patch: Partial<Omit<Settings, 'id' | 'createdAt' | 'updatedAt'>>) {
  const current = getSettings();
  const next = {
    notificationsEnabled: patch.notificationsEnabled ?? current.notificationsEnabled,
    dailyNotificationTime: patch.dailyNotificationTime ?? current.dailyNotificationTime,
    eveningNotificationTime: patch.eveningNotificationTime ?? current.eveningNotificationTime,
    deadlineWarningDays: patch.deadlineWarningDays ?? current.deadlineWarningDays,
    defaultTaskMinutes: patch.defaultTaskMinutes ?? current.defaultTaskMinutes,
    defaultPriority: (patch.defaultPriority ?? current.defaultPriority) as Priority,
    themePreference: (patch.themePreference ?? current.themePreference) as ThemePreference
  };

  db.runSync(
    `UPDATE settings SET
      notificationsEnabled = ?, dailyNotificationTime = ?, eveningNotificationTime = ?,
      deadlineWarningDays = ?, defaultTaskMinutes = ?, defaultPriority = ?, themePreference = ?, updatedAt = ?
     WHERE id = 'app'`,
    [
      next.notificationsEnabled ? 1 : 0,
      next.dailyNotificationTime,
      next.eveningNotificationTime,
      next.deadlineWarningDays,
      next.defaultTaskMinutes,
      next.defaultPriority,
      next.themePreference,
      nowIso()
    ]
  );

  return getSettings();
}
