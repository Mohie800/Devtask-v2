import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DarkTheme, DefaultTheme, NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { TodayScreen } from '@/screens/TodayScreen';
import { TasksScreen } from '@/screens/TasksScreen';
import { ProjectsScreen } from '@/screens/ProjectsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { ProjectDetailScreen } from '@/screens/ProjectDetailScreen';
import { ProjectEditScreen } from '@/screens/ProjectEditScreen';
import { TaskDetailScreen } from '@/screens/TaskDetailScreen';
import { QuickAddScreen } from './QuickAddScreen';
import { AppText } from '@/components/AppText';
import { useTheme } from '@/theme/ThemeContext';

export type RootStackParamList = {
  Tabs: undefined;
  TaskDetail: { taskId: string };
  ProjectDetail: { projectId: string };
  ProjectEdit: { projectId: string };
  QuickAdd: { mode?: 'task' | 'project' | 'payment' } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

function tabIcon(label: string, focused: boolean, color: string) {
  return (
    <View style={[styles.icon, focused && { borderColor: color }]}>
      <AppText variant="caption" color={color}>{label}</AppText>
    </View>
  );
}

function TabNavigator() {
  const theme = useTheme();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.borderSubtle,
          height: 82,
          paddingBottom: 18,
          paddingTop: 8
        }
      }}
    >
      <Tabs.Screen name="Today" component={TodayScreen} options={{ tabBarIcon: ({ color, focused }) => tabIcon('今', focused, color) }} />
      <Tabs.Screen name="Tasks" component={TasksScreen} options={{ tabBarIcon: ({ color, focused }) => tabIcon('✓', focused, color) }} />
      <Tabs.Screen name="Projects" component={ProjectsScreen} options={{ tabBarIcon: ({ color, focused }) => tabIcon('◎', focused, color) }} />
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({ color, focused }) => tabIcon('…', focused, color) }} />
    </Tabs.Navigator>
  );
}

function FloatingQuickAdd({ navigationRef }: { navigationRef: NavigationContainerRef<RootStackParamList> }) {
  const theme = useTheme();
  return (
    <Pressable
      style={[styles.fab, { backgroundColor: theme.colors.accent, shadowColor: theme.colors.shadow }]}
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigationRef.navigate('QuickAdd', { mode: 'task' });
      }}
    >
      <AppText variant="screenTitle" color="#FFFFFF" style={styles.fabText}>+</AppText>
    </Pressable>
  );
}

export function RootNavigator({ navigationRef }: { navigationRef: NavigationContainerRef<RootStackParamList> }) {
  const theme = useTheme();
  const navTheme = theme.isDark ? DarkTheme : DefaultTheme;

  return (
    <View style={styles.root}>
      <NavigationContainer
        ref={navigationRef}
        theme={{
          ...navTheme,
          colors: {
            ...navTheme.colors,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.textPrimary,
            border: theme.colors.borderSubtle,
            primary: theme.colors.accent
          }
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.textPrimary,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.background }
          }}
        >
          <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: 'Task' }} />
          <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: 'Project' }} />
          <Stack.Screen name="ProjectEdit" component={ProjectEditScreen} options={{ title: 'Edit project' }} />
          <Stack.Screen name="QuickAdd" component={QuickAddScreen} options={{ headerShown: false, presentation: 'transparentModal' }} />
        </Stack.Navigator>
      </NavigationContainer>
      <FloatingQuickAdd navigationRef={navigationRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  icon: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 104,
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6
  },
  fabText: { marginTop: -3 }
});
