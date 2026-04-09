import React from 'react';

import { BaseWidgetProps } from '@/src/constants/widgets.registry';
import { GradesHero } from './GradesHero';
import { GradesCard } from './GradesCard';
import { GradesBento } from './GradesBento';
import { GradesRail } from './GradesRail';

export const GradesWidget: React.FC<BaseWidgetProps> = ({ variant, color, size }) => {
  if (variant === 'hero') {
    return <GradesHero accentColor={color} />;
  }
  if (variant === 'card') {
    return <GradesCard accentColor={color} />;
  }
  if (variant === 'bento') {
    return <GradesBento accentColor={color} size={size} />;
  }
  if (variant === 'rail') {
    return <GradesRail accentColor={color} />;
  }
  return null;
};
