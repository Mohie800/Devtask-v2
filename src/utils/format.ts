import { PeriodUnit, Priority, TaskStatus } from '@/types/models';

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount);
}

export function formatDate(dateIso: string) {
  const date = new Date(dateIso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit'
  });
}

export function humanPeriod(value: number, unit: PeriodUnit) {
  const normalized = unit.replace(/s$/, '');
  return `${value} ${normalized}${value === 1 ? '' : 's'}`;
}

export function statusLabel(status: TaskStatus) {
  switch (status) {
    case 'todo':
      return 'To Do';
    case 'in_progress':
      return 'In Progress';
    case 'blocked':
      return 'Blocked';
    case 'done':
      return 'Done';
  }
}

export function priorityLabel(priority: Priority) {
  return priority === 'none' ? 'No priority' : priority[0].toUpperCase() + priority.slice(1);
}
