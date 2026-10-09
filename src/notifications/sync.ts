import { Settings, Task, TaskPostponement } from '@/types/models';
import { buildTodaySections } from '@/core/schedule';
import { Project } from '@/types/models';
import { clearAllDevTaskNotifications, scheduleDailyChecks, scheduleTaskNotifications } from './scheduler';

export async function resyncNotifications(
  settings: Settings,
  tasks: Task[],
  projects: Project[],
  postponements: TaskPostponement[]
) {
  await clearAllDevTaskNotifications();
  if (!settings.notificationsEnabled) return;
  const sections = buildTodaySections(tasks, projects, postponements, settings);
  await scheduleDailyChecks(settings, sections.actionableCount, sections.actionableCount - sections.completedToday);
  const postponementsByTask = new Map<string, TaskPostponement[]>();
  postponements.forEach((item) => {
    const list = postponementsByTask.get(item.taskId) ?? [];
    list.push(item);
    postponementsByTask.set(item.taskId, list);
  });

  await Promise.all(
    tasks
      .filter((task) => task.status !== 'done')
      .map((task) => scheduleTaskNotifications(task, settings, postponementsByTask.get(task.id) ?? []))
  );
}
