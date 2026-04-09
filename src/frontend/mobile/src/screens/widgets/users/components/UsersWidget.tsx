import React from 'react';
import { View } from 'react-native';

import { BaseWidgetProps } from '@/src/constants/widgets.registry';

import { UsersHero } from './UsersHero';
import { UsersCard } from './UsersCard';
import { UsersBento } from './UsersBento';

export const UsersWidget: React.FC<BaseWidgetProps> = ({ variant }) => {
  if (variant === 'hero') return <UsersHero />;
  if (variant === 'card') return <UsersCard />;
  if (variant === 'bento') return <UsersBento />;
  return <View />;
};