import React, { useMemo, useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { TaskRow } from '@/components/TaskRow';
import { CompletionTrack } from '@/components/CompletionTrack';
import { EmptyState } from '@/components/EmptyState';
import { BlockSheet, PostponeSheet } from '@/components/TaskActionSheets';
import { useTheme } from '@/theme/ThemeContext';
import { useAppStore } from '@/state/stores/appStore';
import { getTodaySections, getWeeklyWorkload } from '@/state/selectors';
import { TaskWithProject } from '@/types/models';
import { formatMinutes } from '@/utils/format';

export function TodayScreen({ navigation }: any) {
  const theme = useTheme();
  const store = useAppStore();
  const [postponeTask, setPostponeTask] = useState<TaskWithProject | null>(null);
  const [blockTask, setBlockTask] = useState<TaskWithProject | null>(null);

  const sections = useMemo(() => {
    if (!store.settings) return null;
    return getTodaySections(store.tasks, store.projects, store.postponements, store.settings);
  }, [store.settings, store.tasks, store.projects, store.postponements]);

  const workload = useMemo(() => {
    if (!store.settings) return [];
    return getWeeklyWorkload(store.tasks, store.projects, store.postponements, store.settings);
  }, [store.settings, store.tasks, store.projects, store.postponements]);

  if (!store.settings || !sections) return null;
  const current = sections.overdue[0] ?? sections.today.find((task) => task.status === 'in_progress') ?? sections.today[0];
  const totalActionable = sections.overdue.length + sections.today.length + sections.doneToday.length;

  async function complete(task: TaskWithProject) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await store.setTaskStatus(task.id, 'done');
  }

  async function start(task: TaskWithProject) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await store.setTaskStatus(task.id, 'in_progress');
  }

  function renderTask(task: TaskWithProject, compact = false) {
    return (
      <TaskRow
        key={task.id}
        task={task}
        compact={compact}
        onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
        onStart={() => start(task)}
        onDone={() => complete(task)}
        onPostpone={() => setPostponeTask(task)}
        onBlock={() => setBlockTask(task)}
      />
    );
  }

  return (
    <Screen refreshing={store.busy} onRefresh={() => store.refresh(true)}>
      <View style={styles.header}>
        <View>
          <AppText variant="screenTitle">Good morning</AppText>
          <AppText variant="body" color={theme.colors.textSecondary}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {sections.actionableCount} tasks · {formatMinutes(sections.plannedMinutes)} planned
          </AppText>
        </View>
      </View>

      {!store.projects.length ? (
        <EmptyState
          title="No projects yet"
          message="Create your first project to start organizing your work."
          actionTitle="Create project"
          onAction={() => navigation.navigate('QuickAdd', { mode: 'project' })}
        />
      ) : null}

      {store.projects.length && !sections.actionableCount ? (
        <EmptyState title="You're all caught up" message="No tasks are scheduled for today." />
      ) : null}

      {current ? (
        <Card raised style={[styles.nowCard, { borderColor: current.isOverdue ? theme.colors.overdue : theme.colors.accent }]}>
          <AppText variant="section" color={current.isOverdue ? theme.colors.overdue : theme.colors.accent}>Now</AppText>
          <AppText variant="title">{current.title}</AppText>
          <AppText variant="body" color={theme.colors.textSecondary}>
            {current.projectTitle} · {formatMinutes(current.estimatedMinutes)} · {current.isOverdue ? `${current.daysOverdue} days overdue` : 'ready today'}
          </AppText>
          <View style={styles.nowActions}>
            {current.status !== 'in_progress' ? <Button title="Start" onPress={() => start(current)} /> : null}
            <Button title="Done" variant={current.status === 'in_progress' ? 'primary' : 'secondary'} onPress={() => complete(current)} />
          </View>
        </Card>
      ) : null}

      {sections.overdue.length ? (
        <>
          <SectionHeader title="Overdue" meta={`${sections.overdue.length}`} tone={theme.colors.overdue} />
          <View style={styles.list}>{sections.overdue.map((task) => renderTask(task))}</View>
        </>
      ) : null}

      {sections.today.length ? (
        <>
          <SectionHeader title="Today" meta={`${sections.today.length}`} tone={theme.colors.inProgress} />
          <View style={styles.list}>{sections.today.filter((task) => task.id !== current?.id).map((task) => renderTask(task))}</View>
        </>
      ) : null}

      {sections.approaching.length ? (
        <>
          <SectionHeader title="Approaching deadlines" meta={`${sections.approaching.length}`} tone={theme.colors.blocked} />
          <View style={styles.list}>{sections.approaching.map((task) => renderTask(task, true))}</View>
        </>
      ) : null}

      {sections.upcoming.length ? (
        <>
          <SectionHeader title="Upcoming" meta={`${sections.upcoming.length}`} tone={theme.colors.todo} />
          <Card>
            {sections.upcoming.slice(0, 5).map((task, index) => (
              <Pressable key={task.id} onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })} style={[styles.upcomingRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.borderSubtle }]}>
                <AppText variant="bodyMedium">{task.title}</AppText>
                <AppText variant="meta" color={theme.colors.textSecondary}>
                  {new Date(task.effectiveDate).toLocaleDateString('en-US', { weekday: 'short' })} · {formatMinutes(task.estimatedMinutes)}
                </AppText>
              </Pressable>
            ))}
          </Card>
        </>
      ) : null}

      <Card>
        <CompletionTrack
          completed={sections.doneToday.length}
          total={totalActionable}
          label={`${sections.doneToday.length}/${totalActionable} completed today`}
        />
      </Card>

      <Card>
        <AppText variant="section" color={theme.colors.textSecondary}>Weekly workload</AppText>
        <View style={styles.workload}>
          {workload.map((day) => {
            const max = Math.max(...workload.map((item) => item.minutes), 1);
            return (
              <View key={day.date} style={styles.workloadDay}>
                <View style={[styles.workloadBar, { height: Math.max(8, (day.minutes / max) * 72), backgroundColor: day.minutes ? theme.colors.accent : theme.colors.surfaceMuted }]} />
                <AppText variant="caption" color={theme.colors.textTertiary}>{day.label}</AppText>
              </View>
            );
          })}
        </View>
      </Card>

      <PostponeSheet task={postponeTask} visible={Boolean(postponeTask)} onClose={() => setPostponeTask(null)} />
      <BlockSheet task={blockTask} visible={Boolean(blockTask)} onClose={() => setBlockTask(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nowCard: { gap: 12, borderWidth: 1.5 },
  nowActions: { flexDirection: 'row', gap: 10 },
  list: { gap: 10 },
  upcomingRow: { paddingVertical: 12, gap: 2 },
  workload: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 18 },
  workloadDay: { alignItems: 'center', gap: 8, flex: 1 },
  workloadBar: { width: 22, borderRadius: 999 }
});
