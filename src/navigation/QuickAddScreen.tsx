import React from 'react';
import { QuickAddSheet } from '@/components/QuickAddSheet';

export function QuickAddScreen({ route, navigation }: any) {
  return (
    <QuickAddSheet
      visible
      initialMode={route.params?.mode ?? 'task'}
      onClose={() => navigation.goBack()}
    />
  );
}
