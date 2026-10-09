import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const DEVTASK_CATEGORY = 'devtask-task-actions';

export async function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false
    })
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'DevTask',
      importance: Notifications.AndroidImportance.DEFAULT
    });
    await Notifications.setNotificationChannelAsync('deadlines', {
      name: 'Deadlines',
      importance: Notifications.AndroidImportance.HIGH
    });
  }

  await Notifications.setNotificationCategoryAsync(DEVTASK_CATEGORY, [
    {
      identifier: 'complete',
      buttonTitle: 'Complete',
      options: { opensAppToForeground: false }
    },
    {
      identifier: 'postpone_tomorrow',
      buttonTitle: 'Tomorrow',
      options: { opensAppToForeground: false }
    },
    {
      identifier: 'open',
      buttonTitle: 'Open',
      options: { opensAppToForeground: true }
    }
  ]);
}

export async function ensureNotificationPermissions() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}
