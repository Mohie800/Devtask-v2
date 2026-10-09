import { Owner, Payment, Project, ProjectWithStats, Settings, Task, TaskPostponement } from '@/types/models';
import { buildTodaySections, weeklyWorkload, enrichTasks } from '@/core/schedule';
import { diffCalendarDays, startOfDay } from '@/core/dates';

export function getProjectStats(
  projects: Project[],
  owners: Owner[],
  tasks: Task[],
  payments: Payment[],
  postponements: TaskPostponement[],
  settings: Settings
): ProjectWithStats[] {
  const ownerById = new Map(owners.map((owner) => [owner.id, owner]));
  const enrichedTasks = enrichTasks(tasks, projects, postponements, settings);

  return projects.map((project) => {
    const projectTasks = enrichedTasks.filter((task) => task.projectId === project.id);
    const projectPayments = payments.filter((payment) => payment.projectId === project.id);
    const paidAmount = projectPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const doneTasks = projectTasks.filter((task) => task.status === 'done').length;
    return {
      ...project,
      owner: project.ownerId ? ownerById.get(project.ownerId) ?? null : null,
      totalTasks: projectTasks.length,
      doneTasks,
      inProgressTasks: projectTasks.filter((task) => task.status === 'in_progress').length,
      blockedTasks: projectTasks.filter((task) => task.status === 'blocked').length,
      overdueTasks: projectTasks.filter((task) => task.isOverdue).length,
      paidAmount,
      remainingAmount: project.pledgedAmount == null ? null : project.pledgedAmount - paidAmount,
      progress: projectTasks.length ? doneTasks / projectTasks.length : 0
    };
  });
}

export function getTodaySections(
  tasks: Task[],
  projects: Project[],
  postponements: TaskPostponement[],
  settings: Settings
) {
  return buildTodaySections(tasks, projects, postponements, settings);
}

export function getWeeklyWorkload(
  tasks: Task[],
  projects: Project[],
  postponements: TaskPostponement[],
  settings: Settings
) {
  return weeklyWorkload(enrichTasks(tasks, projects, postponements, settings));
}

export function projectTimeRemaining(project: Project) {
  return diffCalendarDays(startOfDay(new Date()), project.deadlineAt);
}
