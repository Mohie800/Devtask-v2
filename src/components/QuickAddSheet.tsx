import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { useAppStore } from '@/state/stores/appStore';
import { PeriodUnit, Priority } from '@/types/models';
import { Sheet } from './Sheet';
import { Input } from './Input';
import { Button } from './Button';
import { Chip, ChipRow } from './Chip';
import { PeriodPicker } from './PeriodPicker';
import { AppText } from './AppText';
import { useTheme } from '@/theme/ThemeContext';

type Mode = 'task' | 'project' | 'payment';

const durations = [15, 30, 45, 60, 90, 120, 180];
const priorities: Priority[] = ['none', 'low', 'medium', 'high', 'urgent'];

export function QuickAddSheet({
  visible,
  initialMode = 'task',
  onClose
}: {
  visible: boolean;
  initialMode?: Mode;
  onClose: () => void;
}) {
  const theme = useTheme();
  const store = useAppStore();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [startPeriod, setStartPeriod] = useState<[number, PeriodUnit]>([0, 'days']);
  const [deadlinePeriod, setDeadlinePeriod] = useState<[number, PeriodUnit]>([1, 'week']);
  const [projectDeadline, setProjectDeadline] = useState<[number, PeriodUnit]>([1, 'month']);
  const [estimate, setEstimate] = useState(60);
  const [priority, setPriority] = useState<Priority>('none');
  const [pledged, setPledged] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedProject = useMemo(
    () => store.projects.find((project) => project.id === projectId) ?? store.projects[0],
    [projectId, store.projects]
  );

  function reset(nextMode: Mode = mode) {
    setMode(nextMode);
    setTitle('');
    setOwnerName('');
    setOwnerId(null);
    setStartPeriod([0, 'days']);
    setDeadlinePeriod([1, 'week']);
    setProjectDeadline([1, 'month']);
    setEstimate(store.settings?.defaultTaskMinutes ?? 60);
    setPriority(store.settings?.defaultPriority ?? 'none');
    setPledged('');
    setAmount('');
    setNote('');
  }

  async function submit() {
    try {
      setSaving(true);
      if (mode === 'project') {
        let finalOwnerId = ownerId;
        if (!finalOwnerId && ownerName.trim()) {
          const owner = await store.createOwner({ name: ownerName.trim() });
          finalOwnerId = owner.id;
        }
        await store.createProject({
          title,
          ownerId: finalOwnerId,
          deadlineValue: projectDeadline[0],
          deadlineUnit: projectDeadline[1],
          pledgedAmount: pledged.trim() ? Number(pledged) : null
        });
      } else if (mode === 'task') {
        if (!selectedProject) throw new Error('Create a project first');
        await store.createTask({
          projectId: selectedProject.id,
          title,
          priority,
          triggerValue: startPeriod[0],
          triggerUnit: startPeriod[1],
          deadlineValue: deadlinePeriod[0],
          deadlineUnit: deadlinePeriod[1],
          estimatedMinutes: estimate
        });
      } else {
        if (!selectedProject) throw new Error('Create a project first');
        await store.addPayment({
          projectId: selectedProject.id,
          amount: Number(amount),
          note: note.trim() || undefined
        });
      }
      reset(mode);
      onClose();
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Check the fields and try again.');
    } finally {
      setSaving(false);
    }
  }

  const valid =
    mode === 'payment'
      ? Boolean(selectedProject && Number(amount) > 0)
      : Boolean(title.trim() && (mode === 'project' || selectedProject));

  return (
    <Sheet visible={visible} title="Quick add" onClose={onClose}>
      <ChipRow>
        <Chip label="Task" selected={mode === 'task'} onPress={() => setMode('task')} />
        <Chip label="Project" selected={mode === 'project'} onPress={() => setMode('project')} />
        <Chip label="Payment" selected={mode === 'payment'} onPress={() => setMode('payment')} />
      </ChipRow>

      {mode !== 'payment' ? (
        <Input
          label={mode === 'task' ? 'Task title' : 'Project title'}
          placeholder={mode === 'task' ? 'Implement template editor' : 'Client portal rebuild'}
          value={title}
          onChangeText={setTitle}
          autoFocus
        />
      ) : null}

      {mode !== 'project' ? (
        <View style={{ gap: 10 }}>
          <AppText variant="metaMedium" color={theme.colors.textSecondary}>Project</AppText>
          <ChipRow>
            {store.projects.map((project) => (
              <Chip
                key={project.id}
                label={project.title}
                selected={(selectedProject?.id ?? project.id) === project.id}
                onPress={() => setProjectId(project.id)}
              />
            ))}
          </ChipRow>
        </View>
      ) : null}

      {mode === 'task' ? (
        <>
          <PeriodPicker label="Start" value={startPeriod[0]} unit={startPeriod[1]} includeToday onChange={(value, unit) => setStartPeriod([value, unit])} />
          <PeriodPicker label="Deadline" value={deadlinePeriod[0]} unit={deadlinePeriod[1]} onChange={(value, unit) => setDeadlinePeriod([value, unit])} />
          <View style={{ gap: 10 }}>
            <AppText variant="metaMedium" color={theme.colors.textSecondary}>Estimated work</AppText>
            <ChipRow>
              {durations.map((minutes) => (
                <Chip key={minutes} label={minutes < 60 ? `${minutes}m` : `${minutes / 60}h`} selected={estimate === minutes} onPress={() => setEstimate(minutes)} />
              ))}
            </ChipRow>
          </View>
          <View style={{ gap: 10 }}>
            <AppText variant="metaMedium" color={theme.colors.textSecondary}>Priority</AppText>
            <ChipRow>
              {priorities.map((item) => (
                <Chip key={item} label={item === 'none' ? 'None' : item} selected={priority === item} onPress={() => setPriority(item)} />
              ))}
            </ChipRow>
          </View>
        </>
      ) : null}

      {mode === 'project' ? (
        <>
          <View style={{ gap: 10 }}>
            <AppText variant="metaMedium" color={theme.colors.textSecondary}>Owner</AppText>
            <ChipRow>
              {store.owners.map((owner) => (
                <Chip key={owner.id} label={owner.name} selected={ownerId === owner.id} onPress={() => setOwnerId(owner.id)} />
              ))}
            </ChipRow>
            <Input placeholder="Or add new owner" value={ownerName} onChangeText={setOwnerName} />
          </View>
          <PeriodPicker label="Deadline" value={projectDeadline[0]} unit={projectDeadline[1]} onChange={(value, unit) => setProjectDeadline([value, unit])} />
          <Input label="Pledged amount (optional)" placeholder="5000" keyboardType="decimal-pad" value={pledged} onChangeText={setPledged} />
        </>
      ) : null}

      {mode === 'payment' ? (
        <>
          <Input label="Amount" placeholder="1000" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} autoFocus />
          <Input label="Note" placeholder="First milestone" value={note} onChangeText={setNote} />
        </>
      ) : null}

      <Button title={mode === 'task' ? 'Create task' : mode === 'project' ? 'Create project' : 'Add payment'} onPress={submit} loading={saving} disabled={!valid} />
    </Sheet>
  );
}
