import { create } from 'zustand';
import { AppStateStatus } from 'react-native';
import { migrateDatabase, clearAllData, restoreData } from '@/db/schema';
import * as repos from '@/db/repositories';
import { Owner, Payment, Project, Settings, Task, TaskPostponement, TaskStatus } from '@/types/models';
import { resyncNotifications } from '@/notifications/sync';
import { configureNotifications } from '@/notifications/channels';

export interface ExportPayload {
  version: 1;
  exportedAt: string;
  owners: Owner[];
  projects: Project[];
  tasks: Task[];
  payments: Payment[];
  postponements: TaskPostponement[];
  settings: Settings;
}

interface AppStore {
  initialized: boolean;
  busy: boolean;
  settings: Settings | null;
  owners: Owner[];
  projects: Project[];
  tasks: Task[];
  payments: Payment[];
  postponements: TaskPostponement[];
  error: string | null;
  initialize: () => Promise<void>;
  refresh: (resync?: boolean) => Promise<void>;
  handleAppState: (state: AppStateStatus) => Promise<void>;
  createOwner: (input: repos.OwnerInput) => Promise<Owner>;
  createProject: (input: repos.ProjectInput) => Promise<Project>;
  updateProject: (id: string, patch: Parameters<typeof repos.updateProject>[1]) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<void>;
  createTask: (input: repos.TaskInput) => Promise<Task>;
  updateTaskSchedule: (id: string, patch: Parameters<typeof repos.updateTaskSchedule>[1]) => Promise<Task | null>;
  setTaskStatus: (id: string, status: TaskStatus) => Promise<Task | null>;
  blockTask: (id: string, reason?: string, reminderAt?: string | null) => Promise<Task | null>;
  unblockTask: (id: string, status?: TaskStatus) => Promise<Task | null>;
  postponeTask: (id: string, toDate: Date) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<void>;
  addPayment: (input: repos.PaymentInput) => Promise<Payment>;
  deletePayment: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<Omit<Settings, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Settings>;
  exportData: () => string;
  importData: (json: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

async function syncCurrent(state: Pick<AppStore, 'settings' | 'tasks' | 'projects' | 'postponements'>) {
  if (!state.settings) return;
  await resyncNotifications(state.settings, state.tasks, state.projects, state.postponements);
}

export const useAppStore = create<AppStore>((set, get) => ({
  initialized: false,
  busy: false,
  settings: null,
  owners: [],
  projects: [],
  tasks: [],
  payments: [],
  postponements: [],
  error: null,

  initialize: async () => {
    if (get().initialized) return;
    set({ busy: true, error: null });
    try {
      migrateDatabase();
      await configureNotifications();
      await get().refresh(true);
      set({ initialized: true, busy: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to initialize app', busy: false });
    }
  },

  refresh: async (resync = false) => {
    const settings = repos.getSettings();
    const owners = repos.listOwners();
    const projects = repos.listProjects();
    const tasks = repos.listTasks();
    const payments = repos.listPayments();
    const postponements = repos.listPostponements();
    set({ settings, owners, projects, tasks, payments, postponements });
    if (resync) await syncCurrent({ settings, tasks, projects, postponements });
  },

  handleAppState: async (state) => {
    if (state === 'active') await get().refresh(true);
  },

  createOwner: async (input) => {
    const owner = repos.createOwner(input);
    await get().refresh(true);
    return owner;
  },

  createProject: async (input) => {
    const project = repos.createProject(input);
    await get().refresh(true);
    return project;
  },

  updateProject: async (id, patch) => {
    const project = repos.updateProject(id, patch);
    await get().refresh(true);
    return project;
  },

  deleteProject: async (id) => {
    repos.deleteProject(id);
    await get().refresh(true);
  },

  createTask: async (input) => {
    const task = repos.createTask(input);
    await get().refresh(true);
    return task;
  },

  updateTaskSchedule: async (id, patch) => {
    const task = repos.updateTaskSchedule(id, patch);
    await get().refresh(true);
    return task;
  },

  setTaskStatus: async (id, status) => {
    const task = repos.setTaskStatus(id, status);
    await get().refresh(true);
    return task;
  },

  blockTask: async (id, reason, reminderAt) => {
    const task = repos.blockTask(id, reason, reminderAt);
    await get().refresh(true);
    return task;
  },

  unblockTask: async (id, status = 'in_progress') => {
    const task = repos.unblockTask(id, status);
    await get().refresh(true);
    return task;
  },

  postponeTask: async (id, toDate) => {
    const task = repos.postponeTask(id, toDate);
    await get().refresh(true);
    return task;
  },

  deleteTask: async (id) => {
    repos.deleteTask(id);
    await get().refresh(true);
  },

  addPayment: async (input) => {
    const payment = repos.createPayment(input);
    await get().refresh(true);
    return payment;
  },

  deletePayment: async (id) => {
    repos.deletePayment(id);
    await get().refresh(true);
  },

  updateSettings: async (patch) => {
    const settings = repos.updateSettings(patch);
    set({ settings });
    await get().refresh(true);
    return settings;
  },

  exportData: () => {
    const state = get();
    const payload: ExportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      owners: state.owners,
      projects: state.projects,
      tasks: state.tasks,
      payments: state.payments,
      postponements: state.postponements,
      settings: state.settings ?? repos.getSettings()
    };
    return JSON.stringify(payload, null, 2);
  },

  importData: async (json) => {
    const payload = JSON.parse(json) as ExportPayload;
    if (payload.version !== 1) throw new Error('Unsupported export version');
    restoreData({
      owners: payload.owners,
      projects: payload.projects,
      tasks: payload.tasks,
      payments: payload.payments,
      postponements: payload.postponements,
      settings: payload.settings
    });
    await get().refresh(true);
  },

  clearAll: async () => {
    clearAllData();
    await get().refresh(true);
  }
}));
