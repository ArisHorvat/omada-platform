import React from 'react';

import { BaseWidgetProps } from '@/src/constants/widgets.registry';
import { TasksHero } from './TasksHero';
import { TasksCard } from './TasksCard';
import { TasksBento } from './TasksBento';
import { TasksRail } from './TasksRail';

export const TasksWidget: React.FC<BaseWidgetProps> = ({ variant, color, size }) => {
  if (variant === 'hero') {
    return <TasksHero accentColor={color} />;
  }
  if (variant === 'card') {
    return <TasksCard accentColor={color} />;
  }
  if (variant === 'bento') {
    return <TasksBento accentColor={color} size={size} />;
  }
  if (variant === 'rail') {
    return <TasksRail accentColor={color} />;
  }
  return null;
};
