import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { CurrentOrganizationService } from '@/src/services/CurrentOrganizationService';
import { Organization } from '@/src/types';
import { usePullToRefresh } from '@/src/hooks/usePullToRefresh';

export const useDashboardData = () => {
  const { role } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [widgets, setWidgets] = useState<string[]>([]);

  // 1. Refresh Logic
  const fetchDashboardData = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const { refreshing, onRefresh } = usePullToRefresh(fetchDashboardData);

  // 2. Subscription Logic
  useEffect(() => {
    const unsubscribe = CurrentOrganizationService.subscribe((data) => {
      if (data) {
        setOrganization(data);

        const allWidgets = data.widgets || [];
        // Role Check
        if (['SuperAdmin', 'Admin'].includes(role || '')) {
          setWidgets(allWidgets);
        } else if (role && data.roleWidgetMappings?.[role]) {
          setWidgets(data.roleWidgetMappings[role]);
        } else {
          setWidgets(allWidgets);
        }
      }
    });
    return () => unsubscribe();
  }, [role]);

  return { organization, widgets, refreshing, onRefresh };
};