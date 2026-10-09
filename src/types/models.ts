export type PeriodUnit = 'day' | 'days' | 'week' | 'weeks' | 'month' | 'months';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface Owner {
  id: string;
  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  ownerId?: string | null;
  createdAt: string;
  deadlineValue: number;
  deadlineUnit: PeriodUnit;
  deadlineAt: string;
  pledgedAmount?: number | null;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  createdAt: string;
  triggerValue: number;
  triggerUnit: PeriodUnit;
  triggerAt: string;
  deadlineValue: number;
  deadlineUnit: PeriodUnit;
  deadlineAt: string;
  estimatedMinutes: number;
  blockedReason?: string | null;
  blockedReminderAt?: string | null;
  completedAt?: string | null;
  updatedAt: string;
}

export interface Payment {
  id: string;
  projectId: string;
  amount: number;
  date: string;
  note?: string | null;
  createdAt: string;
}

export interface TaskPostponement {
  id: string;
  taskId: string;
  fromDate: string;
  toDate: string;
  createdAt: string;
}

export interface Settings {
  id: 'app';
  notificationsEnabled: boolean;
  dailyNotificationTime: string;
  eveningNotificationTime: string;
  deadlineWarningDays: number;
  defaultTaskMinutes: number;
  defaultPriority: Priority;
  themePreference: ThemePreference;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithStats extends Project {
  owner?: Owner | null;
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  paidAmount: number;
  remainingAmount: number | null;
  progress: number;
}

export interface TaskWithProject extends Task {
  projectTitle?: string;
  effectiveDate: string;
  isOverdue: boolean;
  daysOverdue: number;
  isDueToday: boolean;
  isUpcoming: boolean;
  isApproachingDeadline: boolean;
}
