import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Chip, ChipRow } from '@/components/Chip';
import { PeriodPicker } from '@/components/PeriodPicker';
import { BlockSheet, PostponeSheet } from '@/components/TaskActionSheets';
import { useAppStore } from '@/state/stores/appStore';
import { enrichTasks } from '@/core/schedule';
import { formatDate, formatMinutes, priorityLabel, statusLabel } from '@/utils/format';
import { PeriodUnit, Priority } from '@/types/models';
import { useTheme } from '@/theme/ThemeContext';

const durations = [15, 30, 45, 60, 90, 120, 180];
const priorities: Priority[] = ['none', 'low', 'medium', 'high', 'urgent'];

export function TaskDetailScreen({ route, navigation }: any) {
  const { taskId } = route.params;
  const theme = useTheme();
  const store = useAppStore();
  const [editing, setEditing] = useState(false);
  const [postponeVisible, setPostponeVisible] = useState(false);
  const [blockVisible, setBlockVisible] = useState(false);

  const task = useMemo(() => {
    if (!store.settings) return null;
    return enrichTasks(store.tasks, store.projects, store.postponements, store.settings).find((item) => item.id === taskId) ?? null;
  }, [store.settings, store.tasks, store.projects, store.postponements, taskId]);

  const [title, setTitle] = useState(task?.title ?? '');
  const [estimate, setEstimate] = useState(task?.estimatedMinutes ?? 60);
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'none');
  const [startPeriod, setStartPeriod] = useState<[number, PeriodUnit]>([task?.triggerValue ?? 0, task?.triggerUnit ?? 'days']);
  const [deadlinePeriod, setDeadlinePeriod] = useState<[number, PeriodUnit]>([task?.deadlineValue ?? 1, task?.deadlineUnit ?? 'week']);

  if (!task) return null;
  const history = store.postponements.filter((item) => item.taskId === task.id);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <AppText variant="screenTitle">{task.title}</AppText>
          <AppText variant="body" color={theme.colors.textSecondary}>{task.projectTitle} · {statusLabel(task.status)} · {priorityLabel(task.priority)}</AppText>
        </View>
        <Button title={editing ? 'Cancel' : 'Edit'} variant="secondary" onPress={() => setEditing(!editing)} />
      </View>

      <Card>
        <View style={styles.detailGrid}>
          <View>
            <AppText variant="caption" color={theme.colors.textTertiary}>Starts</AppText>
            <AppText variant="bodyMedium">{formatDate(task.triggerAt)}</AppText>
          </View>
          <View>
            <AppText variant="caption" color={theme.colors.textTertiary}>Effective</AppText>
            <AppText variant="bodyMedium">{formatDate(task.effectiveDate)}</AppText>
          </View>
          <View>
            <AppText variant="caption" color={theme.colors.textTertiary}>Deadline</AppText>
            <AppText variant="bodyMedium" color={task.isOverdue ? theme.colors.overdue : theme.colors.textPrimary}>{formatDate(task.deadlineAt)}</AppText>
          </View>
          <View>
            <AppText variant="caption" color={theme.colors.textTertiary}>Estimate</AppText>
            <AppText variant="bodyMedium">{formatMinutes(task.estimatedMinutes)}</AppText>
          </View>
        </View>
      </Card>

      {editing ? (
        <Card style={styles.editCard}>
          <Input label="Title" value={title} onChangeText={setTitle} />
          <PeriodPicker label="Start" value={startPeriod[0]} unit={startPeriod[1]} includeToday onChange={(value, unit) => setStartPeriod([value, unit])} />
          <PeriodPicker label="Deadline" value={deadlinePeriod[0]} unit={deadlinePeriod[1]} onChange={(value, unit) => setDeadlinePeriod([value, unit])} />
          <View style={{ gap: 10 }}>
            <AppText variant="metaMedium" color={theme.colors.textSecondary}>Estimated work</AppText>
            <ChipRow>{durations.map((minutes) => <Chip key={minutes} label={minutes < 60 ? `${minutes}m` : `${minutes / 60}h`} selected={estimate === minutes} onPress={() => setEstimate(minutes)} />)}</ChipRow>
          </View>
          <View style={{ gap: 10 }}>
            <AppText variant="metaMedium" color={theme.colors.textSecondary}>Priority</AppText>
            <ChipRow>{priorities.map((item) => <Chip key={item} label={item === 'none' ? 'None' : item} selected={priority === item} onPress={() => setPriority(item)} />)}</ChipRow>
          </View>
          <Button
            title="Save changes"
            onPress={async () => {
              await store.updateTaskSchedule(task.id, {
                title,
                estimatedMinutes: estimate,
                priority,
                triggerValue: startPeriod[0],
                triggerUnit: startPeriod[1],
                deadlineValue: deadlinePeriod[0],
                deadlineUnit: deadlinePeriod[1]
              });
              setEditing(false);
            }}
          />
        </Card>
      ) : null}

      <View style={styles.actions}>
        {task.status === 'blocked' ? (
          <Button title="Unblock" onPress={() => store.unblockTask(task.id)} />
        ) : task.status !== 'done' ? (
          <Button title={task.status === 'in_progress' ? 'Keep working' : 'Start'} onPress={() => store.setTaskStatus(task.id, 'in_progress')} />
        ) : null}
        {task.status !== 'done' ? <Button title="Done" variant="secondary" onPress={() => store.setTaskStatus(task.id, 'done')} /> : <Button title="Reopen" variant="secondary" onPress={() => store.setTaskStatus(task.id, 'todo')} />}
      </View>
      {task.status !== 'done' ? (
        <View style={styles.actions}>
          <Button title="Postpone" variant="secondary" onPress={() => setPostponeVisible(true)} />
          <Button title="Block" variant="danger" onPress={() => setBlockVisible(true)} />
        </View>
      ) : null}

      {task.blockedReason ? (
        <Card style={{ borderColor: theme.colors.blocked }}>
          <AppText variant="section" color={theme.colors.blocked}>Blocked reason</AppText>
          <AppText variant="body">{task.blockedReason}</AppText>
        </Card>
      ) : null}

      <Card>
        <AppText variant="section" color={theme.colors.textSecondary}>Postponement history</AppText>
        {history.length ? history.map((item) => (
          <AppText key={item.id} variant="meta" color={theme.colors.textSecondary}>
            {formatDate(item.fromDate)} → {formatDate(item.toDate)}
          </AppText>
        )) : <AppText variant="body" color={theme.colors.textSecondary}>No postponements.</AppText>}
      </Card>

      <Button
        title="Delete task"
        variant="danger"
        onPress={() => {
          Alert.alert('Delete task?', 'This removes the task and its postponement history.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await store.deleteTask(task.id); navigation.goBack(); } }
          ]);
        }}
      />

      <PostponeSheet task={task} visible={postponeVisible} onClose={() => setPostponeVisible(false)} />
      <BlockSheet task={task} visible={blockVisible} onClose={() => setBlockVisible(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  editCard: { gap: 16 },
  actions: { flexDirection: 'row', gap: 10 }
});
