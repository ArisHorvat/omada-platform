import { useState, useEffect } from 'react';
import { orgApi, unwrap } from '@/src/api';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

export const useMoreLogic = (widgetInfo: Record<string, any>) => {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;
  const [allWidgets, setAllWidgets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWidgets = async () => {
        if (!orgId) return;
        
        try {
            // Get Org Details (which includes the 'widgets' array)
            const details = await unwrap(orgApi.getById(orgId));
            
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
  }, [orgId]);

  return { allWidgets, loading };
};