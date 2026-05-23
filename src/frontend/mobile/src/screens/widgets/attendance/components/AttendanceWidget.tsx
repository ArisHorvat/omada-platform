import React from 'react';

import { BaseWidgetProps } from '@/src/constants/widgets.registry';
import { AttendanceHero } from './AttendanceHero';
import { AttendanceCard } from './AttendanceCard';
import { AttendanceBento } from './AttendanceBento';
import { AttendanceRail } from './AttendanceRail';

export const AttendanceWidget: React.FC<BaseWidgetProps> = ({ variant, color, size }) => {
  if (variant === 'hero') {
    return <AttendanceHero accentColor={color} />;
  }
  if (variant === 'card') {
    return <AttendanceCard accentColor={color} />;
  }
  if (variant === 'bento') {
    return <AttendanceBento accentColor={color} size={size} />;
  }
  if (variant === 'rail') {
    return <AttendanceRail accentColor={color} />;
  }
  return null;
};
