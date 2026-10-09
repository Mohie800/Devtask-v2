import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';
import { ThemeProvider } from '@/theme/ThemeContext';
import { useAppStore } from '@/state/stores/appStore';
import { RootNavigator, RootStackParamList } from '@/navigation/RootNavigator';
import { AppText } from '@/components/AppText';
import { useTheme } from '@/theme/ThemeContext';
import { addPeriod } from '@/core/dates';

function Boot() {
  const initialized = useAppStore((state) => state.initialized);
  const error = useAppStore((state) => state.error);
  const theme = useTheme();

  if (!initialized) {
    return (
      <View style={[styles.boot, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
        <AppText variant="body" color={theme.colors.textSecondary}>{error ?? 'Preparing your workbench…'}</AppText>
      </View>
    );
  }

  return null;
}

export default function App() {
  const initialize = useAppStore((state) => state.initialize);
  const handleAppState = useAppStore((state) => state.handleAppState);
  const setTaskStatus = useAppStore((state) => state.setTaskStatus);
  const postponeTask = useAppStore((state) => state.postponeTask);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    initialize();
    const appStateSubscription = AppState.addEventListener('change', handleAppState);
    const notificationSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const taskId = response.notification.request.content.data?.taskId as string | undefined;
      if (!taskId) return;
      if (response.actionIdentifier === 'complete') {
        setTaskStatus(taskId, 'done');
      } else if (response.actionIdentifier === 'postpone_tomorrow') {
        postponeTask(taskId, addPeriod(new Date(), 1, 'day'));
      } else if (navigationRef.current) {
        navigationRef.current.navigate('TaskDetail', { taskId });
      }
    });

    return () => {
      appStateSubscription.remove();
      notificationSubscription.remove();
    };
  }, []);

  const themePreference = useAppStore((state) => state.settings?.themePreference ?? 'system');

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider preference={themePreference}>
          <RootNavigator navigationRef={navigationRef} />
          <Boot />
          <StatusBar style={themePreference === 'dark' ? 'light' : 'auto'} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  boot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16
  }
});
