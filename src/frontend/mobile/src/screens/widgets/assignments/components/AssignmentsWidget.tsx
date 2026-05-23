import React from 'react';

import { BaseWidgetProps } from '@/src/constants/widgets.registry';
import { AssignmentsHero } from './AssignmentsHero';
import { AssignmentsCard } from './AssignmentsCard';
import { AssignmentsBento } from './AssignmentsBento';
import { AssignmentsRail } from './AssignmentsRail';

export const AssignmentsWidget: React.FC<BaseWidgetProps> = ({ variant, color, size }) => {
  if (variant === 'hero') {
    return <AssignmentsHero accentColor={color} />;
  }
  if (variant === 'card') {
    return <AssignmentsCard accentColor={color} />;
  }
  if (variant === 'bento') {
    return <AssignmentsBento accentColor={color} size={size} />;
  }
  if (variant === 'rail') {
    return <AssignmentsRail accentColor={color} />;
  }
  return null;
};
