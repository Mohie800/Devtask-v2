import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Settings, Task, TaskPostponement } from '@/types/models';
import { computeTaskDates, startOfDay } from '@/core/dates';
import { DEVTASK_CATEGORY, ensureNotificationPermissions } from './channels';

const DAILY_ID = 'devtask:daily-summary';
const EVENING_ID = 'devtask:evening-check';

function parseTime(value: string) {
  const [hour = '9', minute = '0'] = value.split(':');
  return { hour: Number(hour), minute: Number(minute) };
}

function dateAt(date: Date | string, time: string) {
  const { hour, minute } = parseTime(time);
  const result = startOfDay(date);
  result.setHours(hour, minute, 0, 0);
  return result;
}

function taskNotificationId(kind: 'start' | 'deadline' | 'blocked', taskId: string) {
  return `devtask:${kind}:${taskId}`;
}

async function cancelIfExists(identifier: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Identifier absence is platform-specific; safe to ignore.
  }
}

export async function cancelTaskNotifications(taskId: string) {
  await Promise.all([
    cancelIfExists(taskNotificationId('start', taskId)),
    cancelIfExists(taskNotificationId('deadline', taskId)),
    cancelIfExists(taskNotificationId('blocked', taskId))
  ]);
}

export async function scheduleTaskNotifications(
  task: Task,
  settings: Settings,
  postponements: TaskPostponement[] = []
) {
  await cancelTaskNotifications(task.id);
  if (!settings.notificationsEnabled || task.status === 'done') return;
  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  const now = new Date();
  const computed = computeTaskDates(task, now, postponements, settings.deadlineWarningDays);
  const startAt = dateAt(computed.effectiveDate, settings.dailyNotificationTime);
  if (startAt.getTime() > now.getTime() && !computed.isOverdue) {
    await Notifications.scheduleNotificationAsync({
      identifier: taskNotificationId('start', task.id),
      content: {
        title: "It's time to work on this today",
        body: task.title,
        categoryIdentifier: DEVTASK_CATEGORY,
        data: { taskId: task.id, type: 'start', devtask: true }
      },
      trigger: Platform.OS === 'android' ? { date: startAt, channelId: 'default' } : { date: startAt }
    });
  }

  const warningDate = new Date(computed.deadlineAt);
  warningDate.setDate(warningDate.getDate() - settings.deadlineWarningDays);
  const warningAt = dateAt(warningDate, settings.dailyNotificationTime);
  if (warningAt.getTime() > now.getTime() && !computed.isOverdue) {
    await Notifications.scheduleNotificationAsync({
      identifier: taskNotificationId('deadline', task.id),
      content: {
        title: settings.deadlineWarningDays === 1 ? 'Deadline tomorrow' : `Deadline in ${settings.deadlineWarningDays} days`,
        body: task.title,
        categoryIdentifier: DEVTASK_CATEGORY,
        data: { taskId: task.id, type: 'deadline', devtask: true }
      },
      trigger: Platform.OS === 'android' ? { date: warningAt, channelId: 'deadlines' } : { date: warningAt }
    });
  }

  if (task.status === 'blocked' && task.blockedReminderAt) {
    const blockedAt = dateAt(task.blockedReminderAt, settings.dailyNotificationTime);
    if (blockedAt.getTime() > now.getTime()) {
      await Notifications.scheduleNotificationAsync({
        identifier: taskNotificationId('blocked', task.id),
        content: {
          title: 'Blocked task reminder',
          body: task.title,
          categoryIdentifier: DEVTASK_CATEGORY,
          data: { taskId: task.id, type: 'blocked', devtask: true }
        },
        trigger: Platform.OS === 'android' ? { date: blockedAt, channelId: 'default' } : { date: blockedAt }
      });
    }
  }
}

export async function scheduleDailyChecks(settings: Settings, todayCount: number, unfinishedCount: number) {
  await Promise.all([cancelIfExists(DAILY_ID), cancelIfExists(EVENING_ID)]);
  if (!settings.notificationsEnabled) return;
  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  const morning = parseTime(settings.dailyNotificationTime);
  const evening = parseTime(settings.eveningNotificationTime);

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: {
      title: 'Good morning',
      body: todayCount ? `You have ${todayCount} task${todayCount === 1 ? '' : 's'} scheduled for today.` : 'No tasks are scheduled for today.',
      data: { type: 'daily', devtask: true }
    },
    trigger: Platform.OS === 'android'
      ? { hour: morning.hour, minute: morning.minute, repeats: true, channelId: 'default' }
      : { hour: morning.hour, minute: morning.minute, repeats: true }
  });

  await Notifications.scheduleNotificationAsync({
    identifier: EVENING_ID,
    content: {
      title: 'End-of-day check',
      body: unfinishedCount ? `You have ${unfinishedCount} unfinished task${unfinishedCount === 1 ? '' : 's'} today.` : 'Today is clear.',
      categoryIdentifier: DEVTASK_CATEGORY,
      data: { type: 'evening', devtask: true }
    },
    trigger: Platform.OS === 'android'
      ? { hour: evening.hour, minute: evening.minute, repeats: true, channelId: 'default' }
      : { hour: evening.hour, minute: evening.minute, repeats: true }
  });
}

export async function clearAllDevTaskNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.identifier.startsWith('devtask:') || item.content.data?.devtask)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
  );
}
