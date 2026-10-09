import React, { useMemo, useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Chip, ChipRow } from '@/components/Chip';
import { Input } from '@/components/Input';
import { TaskRow } from '@/components/TaskRow';
import { EmptyState } from '@/components/EmptyState';
import { BlockSheet, PostponeSheet } from '@/components/TaskActionSheets';
import { useAppStore } from '@/state/stores/appStore';
import { enrichTasks } from '@/core/schedule';
import { TaskWithProject } from '@/types/models';
import { useTheme } from '@/theme/ThemeContext';

const filters = ['all', 'today', 'upcoming', 'overdue', 'in_progress', 'blocked', 'done'] as const;

type Filter = (typeof filters)[number];

export function TasksScreen({ navigation }: any) {
  const theme = useTheme();
  const store = useAppStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [postponeTask, setPostponeTask] = useState<TaskWithProject | null>(null);
  const [blockTask, setBlockTask] = useState<TaskWithProject | null>(null);

  const tasks = useMemo(() => {
    if (!store.settings) return [];
    let result = enrichTasks(store.tasks, store.projects, store.postponements, store.settings);
    if (projectId) result = result.filter((task) => task.projectId === projectId);
    if (query.trim()) result = result.filter((task) => `${task.title} ${task.projectTitle}`.toLowerCase().includes(query.toLowerCase()));
    switch (filter) {
      case 'today':
        return result.filter((task) => task.isDueToday && !task.isOverdue);
      case 'upcoming':
        return result.filter((task) => task.isUpcoming && !task.isApproachingDeadline);
      case 'overdue':
        return result.filter((task) => task.isOverdue);
      case 'in_progress':
      case 'blocked':
      case 'done':
        return result.filter((task) => task.status === filter);
      default:
        return result;
    }
  }, [store.settings, store.tasks, store.projects, store.postponements, filter, query, projectId]);

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <AppText variant="screenTitle">Tasks</AppText>
        <Input placeholder="Search tasks or projects" value={query} onChangeText={setQuery} />
        <ChipRow>
          {filters.map((item) => (
            <Chip key={item} label={item.replace('_', ' ')} selected={filter === item} onPress={() => setFilter(item)} />
          ))}
        </ChipRow>
        <ChipRow>
          <Chip label="All projects" selected={!projectId} onPress={() => setProjectId(null)} />
          {store.projects.map((project) => (
            <Chip key={project.id} label={project.title} selected={projectId === project.id} onPress={() => setProjectId(project.id)} />
          ))}
        </ChipRow>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No tasks found" message="Try a different filter or create a task from Quick Add." />}
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
            onStart={() => store.setTaskStatus(item.id, 'in_progress')}
            onDone={() => store.setTaskStatus(item.id, 'done')}
            onPostpone={() => setPostponeTask(item)}
            onBlock={() => setBlockTask(item)}
          />
        )}
      />
      <PostponeSheet task={postponeTask} visible={Boolean(postponeTask)} onClose={() => setPostponeTask(null)} />
      <BlockSheet task={blockTask} visible={Boolean(blockTask)} onClose={() => setBlockTask(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 14 },
  list: { gap: 10, paddingBottom: 120 }
});
