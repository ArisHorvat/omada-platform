import { useState, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { CurrentOrganizationService } from '@/src/services/CurrentOrganizationService';

export const useMoreLogic = (widgetInfo: Record<string, any>) => {
  const [allWidgets, setAllWidgets] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = CurrentOrganizationService.subscribe((data) => {
      if (data) {
        const widgets: string[] = data.widgets || [];
        setAllWidgets(widgets.filter(w => widgetInfo[w]));
      }
    });
    return () => unsubscribe();
  }, []);

  return { allWidgets };
};