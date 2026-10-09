import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { TaskWithProject } from '@/types/models';
import { useTheme } from '@/theme/ThemeContext';
import { formatMinutes } from '@/utils/format';
import { AppText } from './AppText';

function statusColor(task: TaskWithProject, colors: ReturnType<typeof useTheme>['colors']) {
  if (task.isOverdue) return colors.overdue;
  if (task.status === 'done') return colors.done;
  if (task.status === 'blocked') return colors.blocked;
  if (task.status === 'in_progress') return colors.inProgress;
  if (task.isApproachingDeadline) return colors.blocked;
  return colors.todo;
}

function statusText(task: TaskWithProject) {
  if (task.isOverdue) return `${task.daysOverdue} day${task.daysOverdue === 1 ? '' : 's'} overdue`;
  if (task.status === 'blocked') return task.blockedReason ? `Blocked · ${task.blockedReason}` : 'Blocked';
  if (task.status === 'done') return 'Done';
  if (task.status === 'in_progress') return 'In progress';
  if (task.isDueToday) return 'Today';
  return 'Upcoming';
}

export function TaskRow({
  task,
  onPress,
  onStart,
  onDone,
  onPostpone,
  onBlock,
  compact
}: {
  task: TaskWithProject;
  onPress?: () => void;
  onStart?: () => void;
  onDone?: () => void;
  onPostpone?: () => void;
  onBlock?: () => void;
  compact?: boolean;
}) {
  const theme = useTheme();
  const color = statusColor(task, theme.colors);

  const actions = (
    <View style={styles.actions}>
      {task.status !== 'in_progress' && task.status !== 'done' ? (
        <Pressable style={[styles.action, { backgroundColor: theme.colors.inProgressSoft }]} onPress={onStart}>
          <AppText variant="metaMedium" color={theme.colors.inProgress}>Start</AppText>
        </Pressable>
      ) : null}
      {task.status !== 'done' ? (
        <Pressable style={[styles.action, { backgroundColor: theme.colors.doneSoft }]} onPress={onDone}>
          <AppText variant="metaMedium" color={theme.colors.done}>Done</AppText>
        </Pressable>
      ) : null}
    </View>
  );

  const trailing = (
    <View style={styles.actions}>
      {task.status !== 'done' ? (
        <Pressable style={[styles.action, { backgroundColor: theme.colors.todoSoft }]} onPress={onPostpone}>
          <AppText variant="metaMedium" color={theme.colors.textSecondary}>Later</AppText>
        </Pressable>
      ) : null}
      {task.status !== 'done' ? (
        <Pressable style={[styles.action, { backgroundColor: theme.colors.blockedSoft }]} onPress={onBlock}>
          <AppText variant="metaMedium" color={theme.colors.blocked}>Block</AppText>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <Swipeable
      friction={1.4}
      renderLeftActions={() => actions}
      renderRightActions={() => trailing}
      onSwipeableOpen={async (direction) => {
        await Haptics.selectionAsync();
        if (direction === 'left' && task.status !== 'done') onDone?.();
      }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          compact && styles.compact,
          {
            backgroundColor: theme.colors.surface,
            borderColor: task.isOverdue ? theme.colors.overdue : theme.colors.borderSubtle,
            opacity: pressed ? 0.9 : 1
          }
        ]}
      >
        <View style={[styles.rail, { backgroundColor: color }]} />
        <View style={styles.content}>
          <View style={styles.topLine}>
            <AppText variant="caption" color={theme.colors.textTertiary}>{task.projectTitle ?? 'Project'}</AppText>
            <AppText variant="caption" color={theme.colors.textTertiary}>{formatMinutes(task.estimatedMinutes)}</AppText>
          </View>
          <AppText variant="bodyMedium" numberOfLines={2}>{task.title}</AppText>
          <AppText variant="meta" color={color}>{statusText(task)}</AppText>
        </View>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: 16,
    paddingRight: 14,
    flexDirection: 'row',
    overflow: 'hidden'
  },
  compact: { minHeight: 72 },
  rail: { width: 5 },
  content: { flex: 1, gap: 4, paddingVertical: 12, paddingHorizontal: 14 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  action: { justifyContent: 'center', paddingHorizontal: 18, height: '100%' }
});
