import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Chip, ChipRow } from '@/components/Chip';
import { PeriodPicker } from '@/components/PeriodPicker';
import { useAppStore } from '@/state/stores/appStore';
import { PeriodUnit } from '@/types/models';
import { useTheme } from '@/theme/ThemeContext';

export function ProjectEditScreen({ route, navigation }: any) {
  const { projectId } = route.params;
  const theme = useTheme();
  const store = useAppStore();
  const project = store.projects.find((item) => item.id === projectId);
  const [title, setTitle] = useState(project?.title ?? '');
  const [ownerId, setOwnerId] = useState(project?.ownerId ?? null);
  const [ownerName, setOwnerName] = useState('');
  const [deadline, setDeadline] = useState<[number, PeriodUnit]>([project?.deadlineValue ?? 1, project?.deadlineUnit ?? 'month']);
  const [pledged, setPledged] = useState(project?.pledgedAmount?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  if (!project) return null;

  return (
    <Screen>
      <AppText variant="screenTitle">Edit project</AppText>
      <Card style={{ gap: 16 }}>
        <Input label="Title" value={title} onChangeText={setTitle} />
        <View style={{ gap: 10 }}>
          <AppText variant="metaMedium" color={theme.colors.textSecondary}>Owner</AppText>
          <ChipRow>
            <Chip label="None" selected={!ownerId} onPress={() => setOwnerId(null)} />
            {store.owners.map((owner) => (
              <Chip key={owner.id} label={owner.name} selected={ownerId === owner.id} onPress={() => setOwnerId(owner.id)} />
            ))}
          </ChipRow>
          <Input placeholder="Or add new owner" value={ownerName} onChangeText={setOwnerName} />
        </View>
        <PeriodPicker label="Deadline" value={deadline[0]} unit={deadline[1]} onChange={(value, unit) => setDeadline([value, unit])} />
        <Input label="Pledged amount" keyboardType="decimal-pad" value={pledged} onChangeText={setPledged} />
        <Button
          title="Save changes"
          loading={saving}
          onPress={async () => {
            setSaving(true);
            let finalOwnerId = ownerId;
            if (!finalOwnerId && ownerName.trim()) {
              const owner = await store.createOwner({ name: ownerName.trim() });
              finalOwnerId = owner.id;
            }
            await store.updateProject(project.id, {
              title,
              ownerId: finalOwnerId,
              deadlineValue: deadline[0],
              deadlineUnit: deadline[1],
              pledgedAmount: pledged.trim() ? Number(pledged) : null
            });
            setSaving(false);
            navigation.goBack();
          }}
        />
      </Card>
      <Button
        title="Delete project"
        variant="danger"
        onPress={() => Alert.alert('Delete project?', 'This deletes its tasks, postponements, and payments.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: async () => { await store.deleteProject(project.id); navigation.goBack(); } }
        ])}
      />
    </Screen>
  );
}
