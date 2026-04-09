import React from 'react';
import { View } from 'react-native';
import { BaseWidgetProps } from '@/src/constants/widgets.registry';
import { NewsHero } from './NewsHero';
import { NewsCard } from './NewsCard';
import { NewsBento } from './NewsBento';

export const NewsWidget: React.FC<BaseWidgetProps> = ({ variant, color, size }) => {
  if (variant === 'hero') {
    return <NewsHero />;
  }

  if (variant === 'card') {
    return <NewsCard />;
  }
  
  if (variant === 'bento') {
      return <NewsBento />;
  }
  
  return <View />;
};