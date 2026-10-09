import { Project, Settings, Task, TaskPostponement, TaskWithProject, Priority } from '../types/models';
import { computeTaskDates, diffCalendarDays, startOfDay } from './dates';

export const priorityScore: Record<Priority, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4
};

export interface TodaySections {
  overdue: TaskWithProject[];
  today: TaskWithProject[];
  approaching: TaskWithProject[];
  upcoming: TaskWithProject[];
  doneToday: TaskWithProject[];
  all: TaskWithProject[];
  plannedMinutes: number;
  completedToday: number;
  actionableCount: number;
}

export function enrichTasks(
  tasks: Task[],
  projects: Project[],
  postponements: TaskPostponement[],
  settings: Pick<Settings, 'deadlineWarningDays'>,
  todayInput: Date | string = new Date()
): TaskWithProject[] {
  const today = startOfDay(todayInput);
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const postponementsByTask = new Map<string, TaskPostponement[]>();

  postponements.forEach((item) => {
    const list = postponementsByTask.get(item.taskId) ?? [];
    list.push(item);
    postponementsByTask.set(item.taskId, list);
  });

  return tasks.map((task) => {
    const computed = computeTaskDates(
      task,
      today,
      postponementsByTask.get(task.id) ?? [],
      settings.deadlineWarningDays
    );

    return {
      ...task,
      projectTitle: projectById.get(task.projectId)?.title,
      effectiveDate: computed.effectiveDate.toISOString(),
      isOverdue: computed.isOverdue,
      daysOverdue: computed.daysOverdue,
      isDueToday: computed.isDueToday,
      isUpcoming: computed.isUpcoming,
      isApproachingDeadline: computed.isApproachingDeadline
    };
  });
}

export function buildTodaySections(
  tasks: Task[],
  projects: Project[],
  postponements: TaskPostponement[],
  settings: Pick<Settings, 'deadlineWarningDays'>,
  todayInput: Date | string = new Date()
): TodaySections {
  const today = startOfDay(todayInput);
  const enriched = enrichTasks(tasks, projects, postponements, settings, today);
  const sortActive = (a: TaskWithProject, b: TaskWithProject) => {
    const deadlineDiff = startOfDay(a.deadlineAt).getTime() - startOfDay(b.deadlineAt).getTime();
    if (deadlineDiff !== 0) return deadlineDiff;
    return priorityScore[b.priority] - priorityScore[a.priority];
  };

  const doneToday = enriched
    .filter((task) => task.status === 'done' && task.completedAt && startOfDay(task.completedAt).getTime() === today.getTime())
    .sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''));

  const overdue = enriched.filter((task) => task.isOverdue).sort(sortActive);
  const todayTasks = enriched
    .filter((task) => !task.isOverdue && task.isDueToday)
    .sort(sortActive);
  const approaching = enriched
    .filter((task) => !task.isOverdue && !task.isDueToday && task.isApproachingDeadline)
    .sort(sortActive);
  const upcoming = enriched
    .filter((task) => !task.isOverdue && !task.isDueToday && !task.isApproachingDeadline && task.isUpcoming)
    .sort((a, b) => startOfDay(a.effectiveDate).getTime() - startOfDay(b.effectiveDate).getTime());

  const actionable = [...overdue, ...todayTasks];
  const plannedMinutes = actionable.reduce((sum, task) => sum + task.estimatedMinutes, 0);

  return {
    overdue,
    today: todayTasks,
    approaching,
    upcoming,
    doneToday,
    all: enriched,
    plannedMinutes,
    completedToday: doneToday.length,
    actionableCount: actionable.length
  };
}

export function groupUpcomingByDay(tasks: TaskWithProject[]) {
  const groups = new Map<string, TaskWithProject[]>();
  tasks.forEach((task) => {
    const key = startOfDay(task.effectiveDate).toISOString();
    const list = groups.get(key) ?? [];
    list.push(task);
    groups.set(key, list);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({ date, items }));
}

export function weeklyWorkload(tasks: TaskWithProject[], weekStartInput: Date | string = new Date()) {
  const weekStart = startOfDay(weekStartInput);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      date: date.toISOString(),
      minutes: 0,
      label: date.toLocaleDateString('en-US', { weekday: 'short' })
    };
  });

  tasks
    .filter((task) => task.status !== 'done')
    .forEach((task) => {
      const offset = diffCalendarDays(weekStart, task.isOverdue ? new Date() : task.effectiveDate);
      if (offset >= 0 && offset < 7) days[offset].minutes += task.estimatedMinutes;
    });

  return days;
}
