import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { TaskRow } from '@/components/TaskRow';
import { CompletionTrack } from '@/components/CompletionTrack';
import { BlockSheet, PostponeSheet } from '@/components/TaskActionSheets';
import { useAppStore } from '@/state/stores/appStore';
import { getProjectStats, projectTimeRemaining } from '@/state/selectors';
import { enrichTasks } from '@/core/schedule';
import { useTheme } from '@/theme/ThemeContext';
import { formatDate, formatMinutes, formatMoney } from '@/utils/format';
import { TaskWithProject } from '@/types/models';

export function ProjectDetailScreen({ route, navigation }: any) {
  const { projectId } = route.params;
  const theme = useTheme();
  const store = useAppStore();
  const [postponeTask, setPostponeTask] = useState<TaskWithProject | null>(null);
  const [blockTask, setBlockTask] = useState<TaskWithProject | null>(null);

  const project = useMemo(() => {
    if (!store.settings) return null;
    return getProjectStats(store.projects, store.owners, store.tasks, store.payments, store.postponements, store.settings)
      .find((item) => item.id === projectId) ?? null;
  }, [store.settings, store.projects, store.owners, store.tasks, store.payments, store.postponements, projectId]);

  const tasks = useMemo(() => {
    if (!store.settings) return [];
    return enrichTasks(store.tasks, store.projects, store.postponements, store.settings).filter((task) => task.projectId === projectId);
  }, [store.settings, store.tasks, store.projects, store.postponements, projectId]);

  const payments = store.payments.filter((payment) => payment.projectId === projectId);
  if (!project) return null;
  const remainingDays = projectTimeRemaining(project);

  return (
    <Screen refreshing={store.busy} onRefresh={() => store.refresh(true)}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <AppText variant="screenTitle">{project.title}</AppText>
          <AppText variant="body" color={theme.colors.textSecondary}>{project.owner?.name ?? 'No owner'} · due {formatDate(project.deadlineAt)}</AppText>
        </View>
        <Button title="Edit" variant="secondary" onPress={() => navigation.navigate('ProjectEdit', { projectId })} />
      </View>

      <View style={styles.metricGrid}>
        <Card style={styles.metric}>
          <AppText variant="caption" color={theme.colors.textTertiary}>Progress</AppText>
          <AppText variant="title">{Math.round(project.progress * 100)}%</AppText>
        </Card>
        <Card style={styles.metric}>
          <AppText variant="caption" color={theme.colors.textTertiary}>Time</AppText>
          <AppText variant="title" color={remainingDays < 0 ? theme.colors.overdue : theme.colors.textPrimary}>{remainingDays < 0 ? `${Math.abs(remainingDays)}d over` : `${remainingDays}d`}</AppText>
        </Card>
        <Card style={styles.metric}>
          <AppText variant="caption" color={theme.colors.textTertiary}>Payment</AppText>
          <AppText variant="title" color={theme.colors.payment}>{project.remainingAmount == null ? '—' : formatMoney(project.remainingAmount)}</AppText>
        </Card>
      </View>

      <Card>
        <CompletionTrack completed={project.doneTasks} total={project.totalTasks} label={`${project.doneTasks}/${project.totalTasks} tasks complete`} />
        <View style={styles.breakdown}>
          <AppText variant="meta" color={theme.colors.textSecondary}>{project.inProgressTasks} active</AppText>
          <AppText variant="meta" color={theme.colors.blocked}>{project.blockedTasks} blocked</AppText>
          <AppText variant="meta" color={theme.colors.overdue}>{project.overdueTasks} overdue</AppText>
        </View>
      </Card>

      <SectionHeader title="Tasks" meta={`${tasks.length}`} tone={theme.colors.accent} />
      <View style={styles.list}>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
            onStart={() => store.setTaskStatus(task.id, 'in_progress')}
            onDone={() => store.setTaskStatus(task.id, 'done')}
            onPostpone={() => setPostponeTask(task)}
            onBlock={() => setBlockTask(task)}
          />
        ))}
      </View>

      <SectionHeader title="Payments" meta={`${payments.length}`} tone={theme.colors.payment} />
      <Card>
        {payments.length ? payments.map((payment, index) => (
          <View key={payment.id} style={[styles.paymentRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.borderSubtle }]}>
            <View>
              <AppText variant="bodyMedium">{formatMoney(payment.amount)}</AppText>
              <AppText variant="meta" color={theme.colors.textSecondary}>{payment.note ?? 'Payment'}</AppText>
            </View>
            <AppText variant="meta" color={theme.colors.textTertiary}>{formatDate(payment.date)}</AppText>
          </View>
        )) : <AppText variant="body" color={theme.colors.textSecondary}>No payments recorded yet.</AppText>}
      </Card>

      <PostponeSheet task={postponeTask} visible={Boolean(postponeTask)} onClose={() => setPostponeTask(null)} />
      <BlockSheet task={blockTask} visible={Boolean(blockTask)} onClose={() => setBlockTask(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  metricGrid: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, gap: 6 },
  breakdown: { flexDirection: 'row', gap: 14, marginTop: 12 },
  list: { gap: 10 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, gap: 12 }
});
