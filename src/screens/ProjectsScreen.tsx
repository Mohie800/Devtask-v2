import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Chip, ChipRow } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { CompletionTrack } from '@/components/CompletionTrack';
import { useAppStore } from '@/state/stores/appStore';
import { getProjectStats, projectTimeRemaining } from '@/state/selectors';
import { useTheme } from '@/theme/ThemeContext';
import { formatMoney } from '@/utils/format';

const sorts = ['active', 'deadline', 'progress', 'owner'] as const;
type Sort = (typeof sorts)[number];

export function ProjectsScreen({ navigation }: any) {
  const theme = useTheme();
  const store = useAppStore();
  const [sort, setSort] = useState<Sort>('active');

  const projects = useMemo(() => {
    if (!store.settings) return [];
    const stats = getProjectStats(store.projects, store.owners, store.tasks, store.payments, store.postponements, store.settings);
    const sorted = [...stats];
    if (sort === 'deadline') sorted.sort((a, b) => a.deadlineAt.localeCompare(b.deadlineAt));
    if (sort === 'progress') sorted.sort((a, b) => b.progress - a.progress);
    if (sort === 'owner') sorted.sort((a, b) => (a.owner?.name ?? '').localeCompare(b.owner?.name ?? ''));
    if (sort === 'active') sorted.sort((a, b) => b.overdueTasks - a.overdueTasks || b.inProgressTasks - a.inProgressTasks);
    return sorted;
  }, [store.settings, store.projects, store.owners, store.tasks, store.payments, store.postponements, sort]);

  return (
    <Screen refreshing={store.busy} onRefresh={() => store.refresh(true)}>
      <AppText variant="screenTitle">Projects</AppText>
      <ChipRow>
        {sorts.map((item) => (
          <Chip key={item} label={item} selected={sort === item} onPress={() => setSort(item)} />
        ))}
      </ChipRow>

      {!projects.length ? (
        <EmptyState
          title="No projects yet"
          message="Create your first project to start organizing your work."
          actionTitle="Create project"
          onAction={() => navigation.navigate('QuickAdd', { mode: 'project' })}
        />
      ) : null}

      <View style={styles.list}>
        {projects.map((project) => {
          const remainingDays = projectTimeRemaining(project);
          return (
            <Pressable key={project.id} onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}>
              <Card style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <View style={styles.projectTitleWrap}>
                    <AppText variant="title">{project.title}</AppText>
                    <AppText variant="meta" color={theme.colors.textSecondary}>{project.owner?.name ?? 'No owner'}</AppText>
                  </View>
                  <AppText variant="metaMedium" color={remainingDays < 0 ? theme.colors.overdue : theme.colors.textSecondary}>
                    {remainingDays < 0 ? `${Math.abs(remainingDays)} days over` : `${remainingDays} days left`}
                  </AppText>
                </View>
                <CompletionTrack completed={project.doneTasks} total={project.totalTasks} label={`${project.doneTasks}/${project.totalTasks} tasks done`} />
                <View style={styles.statsRow}>
                  <AppText variant="meta" color={theme.colors.textSecondary}>{project.inProgressTasks} active</AppText>
                  <AppText variant="meta" color={project.blockedTasks ? theme.colors.blocked : theme.colors.textSecondary}>{project.blockedTasks} blocked</AppText>
                  <AppText variant="meta" color={project.overdueTasks ? theme.colors.overdue : theme.colors.textSecondary}>{project.overdueTasks} overdue</AppText>
                </View>
                {project.remainingAmount != null ? (
                  <AppText variant="metaMedium" color={theme.colors.payment}>{formatMoney(project.remainingAmount)} remaining</AppText>
                ) : null}
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  projectCard: { gap: 14 },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  projectTitleWrap: { flex: 1, gap: 2 },
  statsRow: { flexDirection: 'row', gap: 14 }
});
