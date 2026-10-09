import React, { useState } from 'react';
import { Alert, Share, Switch, View, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Chip, ChipRow } from '@/components/Chip';
import { Input } from '@/components/Input';
import { useAppStore } from '@/state/stores/appStore';
import { ThemePreference } from '@/types/models';
import { useTheme } from '@/theme/ThemeContext';

export function SettingsScreen() {
  const theme = useTheme();
  const store = useAppStore();
  const settings = store.settings;
  const [importText, setImportText] = useState('');
  if (!settings) return null;

  return (
    <Screen>
      <AppText variant="screenTitle">Settings</AppText>

      <Card style={styles.section}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyMedium">Notifications</AppText>
            <AppText variant="meta" color={theme.colors.textSecondary}>Daily plan, task starts, deadline warnings, and evening checks.</AppText>
          </View>
          <Switch value={settings.notificationsEnabled} onValueChange={(value) => store.updateSettings({ notificationsEnabled: value })} />
        </View>
        <Input label="Daily time" value={settings.dailyNotificationTime} onChangeText={(value) => store.updateSettings({ dailyNotificationTime: value })} placeholder="09:00" />
        <Input label="Evening time" value={settings.eveningNotificationTime} onChangeText={(value) => store.updateSettings({ eveningNotificationTime: value })} placeholder="22:00" />
        <View style={{ gap: 10 }}>
          <AppText variant="metaMedium" color={theme.colors.textSecondary}>Deadline warning</AppText>
          <ChipRow>
            {[1, 2, 3].map((days) => (
              <Chip key={days} label={`${days} day${days === 1 ? '' : 's'} before`} selected={settings.deadlineWarningDays === days} onPress={() => store.updateSettings({ deadlineWarningDays: days })} />
            ))}
          </ChipRow>
        </View>
      </Card>

      <Card style={styles.section}>
        <AppText variant="bodyMedium">Appearance</AppText>
        <ChipRow>
          {(['system', 'light', 'dark'] as ThemePreference[]).map((item) => (
            <Chip key={item} label={item} selected={settings.themePreference === item} onPress={() => store.updateSettings({ themePreference: item })} />
          ))}
        </ChipRow>
      </Card>

      <Card style={styles.section}>
        <AppText variant="bodyMedium">Defaults</AppText>
        <View style={{ gap: 10 }}>
          <AppText variant="metaMedium" color={theme.colors.textSecondary}>Task duration</AppText>
          <ChipRow>
            {[30, 60, 90, 120].map((minutes) => (
              <Chip key={minutes} label={`${minutes}m`} selected={settings.defaultTaskMinutes === minutes} onPress={() => store.updateSettings({ defaultTaskMinutes: minutes })} />
            ))}
          </ChipRow>
        </View>
      </Card>

      <Card style={styles.section}>
        <AppText variant="bodyMedium">Data</AppText>
        <Button
          title="Export JSON"
          variant="secondary"
          onPress={async () => {
            await Share.share({ message: store.exportData() });
          }}
        />
        <Input label="Import JSON" value={importText} onChangeText={setImportText} multiline placeholder="Paste exported JSON here" />
        <Button
          title="Import data"
          variant="secondary"
          disabled={!importText.trim()}
          onPress={async () => {
            try {
              await store.importData(importText);
              setImportText('');
              Alert.alert('Import complete', 'Your DevTask data was imported.');
            } catch (error) {
              Alert.alert('Import failed', error instanceof Error ? error.message : 'Invalid JSON');
            }
          }}
        />
        <Button
          title="Clear all data"
          variant="danger"
          onPress={() => Alert.alert('Clear all data?', 'This permanently removes every project, task, payment, and owner.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: () => store.clearAll() }
          ])}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 16 }
});
