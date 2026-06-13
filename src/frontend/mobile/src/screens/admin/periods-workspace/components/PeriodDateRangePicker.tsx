import React, { useMemo } from 'react';
import { View } from 'react-native';

import { ClayDatePicker } from '@/src/components/ui/ClayDatePicker';
import { useThemeColors } from '@/src/hooks';
import { createPeriodsWorkspaceStyles } from '../styles/periods-workspace.styles';

type Props = {
  startDate: Date;
  endDate: Date;
  onStartChange: (date: Date) => void;
  onEndChange: (date: Date) => void;
};

export function PeriodDateRangePicker({ startDate, endDate, onStartChange, onEndChange }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createPeriodsWorkspaceStyles(colors), [colors]);

  return (
    <View style={[styles.dateRow, { flexDirection: 'column', marginBottom: 14 }]}>
      <ClayDatePicker
        compact
        mode="range"
        value={startDate}
        endValue={endDate}
        onChange={onStartChange}
        onRangeChange={(start, end) => {
          onStartChange(start);
          onEndChange(end);
        }}
      />
    </View>
  );
}
