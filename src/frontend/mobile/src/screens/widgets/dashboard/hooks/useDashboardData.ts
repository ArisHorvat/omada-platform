import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { OrganizationService } from '@/src/services/OrganizationService';
import { OrganizationDetailsDto } from '@/src/types/api';
import { usePullToRefresh } from '@/src/hooks/usePullToRefresh';

export const useDashboardData = () => {
  const { activeSession } = useAuth();
  const [organization, setOrganization] = useState<OrganizationDetailsDto | null>(null);
  const [widgets, setWidgets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!activeSession?.orgId) return;

    try {
      // 1. Fetch Org Details
      const data = await OrganizationService.getById(activeSession.orgId);
      setOrganization(data);

      // 2. Calculate Visible Widgets
      const allWidgets = data.widgets || [];
      const role = activeSession.role;

      if (['SuperAdmin', 'Admin'].includes(role || '')) {
        setWidgets(allWidgets);
      } else if (role && data.roleWidgetMappings?.[role]) {
        // Since backend sends Dictionary<string, string[]>, access it directly
        setWidgets(data.roleWidgetMappings[role] || []);
      } else {
        // Fallback: Show all or empty depending on your business rule
        setWidgets(allWidgets);
      }
    } catch (e) {
      console.error("Failed to load dashboard", e);
    } finally {
      setIsLoading(false);
    }
  }, [activeSession?.orgId, activeSession?.role]);

  // Initial Load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const { refreshing, onRefresh } = usePullToRefresh(fetchDashboardData);

  return {
    organization,
    widgets,
    refreshing,
    onRefresh,
    isLoading
  };
};