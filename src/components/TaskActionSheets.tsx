import React, { useState } from 'react';
import { View } from 'react-native';
import { addPeriod } from '@/core/dates';
import { useAppStore } from '@/state/stores/appStore';
import { TaskWithProject } from '@/types/models';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { Input } from './Input';
import { Chip, ChipRow } from './Chip';

export function PostponeSheet({
  task,
  visible,
  onClose
}: {
  task: TaskWithProject | null;
  visible: boolean;
  onClose: () => void;
}) {
  const postponeTask = useAppStore((state) => state.postponeTask);
  const [saving, setSaving] = useState(false);
  const options = [
    { label: 'Tomorrow', date: addPeriod(new Date(), 1, 'day') },
    { label: 'In 2 days', date: addPeriod(new Date(), 2, 'days') },
    { label: 'Next week', date: addPeriod(new Date(), 1, 'week') }
  ];

  return (
    <Sheet visible={visible} title="Postpone" onClose={onClose}>
      <ChipRow>
        {options.map((option) => (
          <Chip
            key={option.label}
            label={option.label}
            onPress={async () => {
              if (!task) return;
              setSaving(true);
              await postponeTask(task.id, option.date);
              setSaving(false);
              onClose();
            }}
          />
        ))}
      </ChipRow>
      <View style={{ opacity: saving ? 0.5 : 1 }}>
        <Button title="Keep real deadline unchanged" variant="secondary" onPress={onClose} />
      </View>
    </Sheet>
  );
}

export function BlockSheet({
  task,
  visible,
  onClose
}: {
  task: TaskWithProject | null;
  visible: boolean;
  onClose: () => void;
}) {
  const blockTask = useAppStore((state) => state.blockTask);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <Sheet visible={visible} title="Block task" onClose={onClose}>
      <Input label="Reason" placeholder="Waiting for Meta verification" value={reason} onChangeText={setReason} autoFocus />
      <Button
        title="Mark blocked"
        variant="danger"
        loading={saving}
        onPress={async () => {
          if (!task) return;
          setSaving(true);
          await blockTask(task.id, reason.trim() || undefined, null);
          setSaving(false);
          setReason('');
          onClose();
        }}
      />
    </Sheet>
  );
}
