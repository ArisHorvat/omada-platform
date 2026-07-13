import React from 'react';

import { BaseWidgetProps } from '@/src/constants/widgets.registry';
import { AnnouncementsBento } from './AnnouncementsBento';
import { AnnouncementsCard } from './AnnouncementsCard';
import { AnnouncementsHero } from './AnnouncementsHero';
import { AnnouncementsRail } from './AnnouncementsRail';

export const AnnouncementsWidget: React.FC<BaseWidgetProps> = ({ variant, color, size }) => {
  if (variant === 'hero') {
    return <AnnouncementsHero accentColor={color} />;
  }
  if (variant === 'card') {
    return <AnnouncementsCard accentColor={color} />;
  }
  if (variant === 'bento') {
    return <AnnouncementsBento accentColor={color} size={size} />;
  }
  if (variant === 'rail') {
    return <AnnouncementsRail accentColor={color} />;
  }
  return null;
};
