import React from 'react';
import { BaseWidgetProps } from '@/src/constants/widgets.registry';
import { AnimatedItem } from '@/src/components/animations';
import { DocumentsBento } from './DocumentsBento';
import { DocumentsCard } from './DocumentsCard';

export const DocumentsWidget: React.FC<BaseWidgetProps> = ({ variant, color, size }) => {
  if (variant === 'bento') {
    return <DocumentsBento accentColor={color} size={size} />;
  }

  if (variant === 'hero' || variant === 'card') {
    return <DocumentsCard accentColor={color} />;
  }

  return (
    <AnimatedItem>
      <DocumentsCard accentColor={color} />
    </AnimatedItem>
  );
};
