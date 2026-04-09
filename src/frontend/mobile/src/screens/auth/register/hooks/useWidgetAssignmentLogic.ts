import { useState, useMemo } from 'react';
import { useRegistrationContext } from '@/src/screens/auth/register/context/RegistrationContext';
import { BASE_WIDGETS } from '@/src/constants/widgets';

const CORE_WIDGETS = ['profile', 'dashboard', 'settings', 'users'];

export const useWidgetAssignmentLogic = () => {
  const { orgData, roleWidgetAccess } = useRegistrationContext();
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const orgType = orgData?.type || 'university'; 

  const visibleWidgets = useMemo(() => {
    return Object.entries(BASE_WIDGETS)
      .map(([key, def]) => ({ id: key, ...def }))
      .filter(w => {
        if (CORE_WIDGETS.includes(w.id)) return false;
        if (w.availability === 'all') return true;
        return w.availability === orgType;
      });
  }, [orgType]);

  const isWidgetActive = (widgetId: string) => {
    if (!roleWidgetAccess) return false;
    return Object.values(roleWidgetAccess).some(rolePermissions => !!rolePermissions[widgetId]);
  };

  return { visibleWidgets, activeWidgetId, setActiveWidgetId, isWidgetActive };
};