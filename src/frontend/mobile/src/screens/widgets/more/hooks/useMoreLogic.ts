import { useState, useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { OrganizationService } from '@/src/services/OrganizationService';

export const useMoreLogic = (widgetInfo: Record<string, any>) => {
  const { activeSession } = useAuth();
  const [allWidgets, setAllWidgets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWidgets = async () => {
        if (!activeSession?.orgId) return;
        
        try {
            // Get Org Details (which includes the 'widgets' array)
            const details = await OrganizationService.getById(activeSession.orgId);
            
            // Filter: Only show widgets that exist in the UI map AND are enabled for this Org
            const enabledWidgets = (details.widgets || []).filter(w => widgetInfo[w]);
            setAllWidgets(enabledWidgets);
        } catch (e) {
            console.error("Failed to load widgets", e);
        } finally {
            setLoading(false);
        }
    };

    fetchWidgets();
  }, [activeSession?.orgId]);

  return { allWidgets, loading };
};