import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useUserPreferences } from '@/src/context/UserPreferencesContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/hooks';
import { CurrentOrganizationService } from '@/src/services/CurrentOrganizationService';
import { Organization } from '@/src/types';
import { usePullToRefresh } from '@/src/hooks/usePullToRefresh'; 

export const useDashboardLogic = () => {
  const { role } = useAuth();
  const colors = useThemeColors();
  const { pinnedWidgets } = useUserPreferences();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [widgets, setWidgets] = useState<string[]>([]);
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  const fetchDashboardData = useCallback(async () => {
    // Re-fetch organization data or sync widgets
    // For now, we simulate a network request or force a re-sync
    await new Promise(resolve => setTimeout(resolve, 1500));
    // In a real app, you might call OrganizationService.refresh() here
  }, []);

  const { refreshing, onRefresh } = usePullToRefresh(fetchDashboardData);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setGreeting(hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening');
    setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));

    const unsubscribe = CurrentOrganizationService.subscribe((data) => {
      if (data) {
        setOrganization(data);
        // Role-based widget filtering
        const allWidgets = data.widgets || [];
        if (role === 'SuperAdmin' || role === 'Admin') {
          setWidgets(allWidgets);
        } else if (data.roleWidgetMappings && role && data.roleWidgetMappings[role]) {
          setWidgets(data.roleWidgetMappings[role]);
        } else {
          setWidgets(allWidgets);
        }
      }
    });
    return () => unsubscribe();
  }, [role]);

  // Widget Metadata Configuration
  const widgetConfig = useMemo(() => {
    const baseWidgets: Record<string, any> = {
      // 1. CORE (Always On)
      schedule: { name: 'Schedule', icon: 'calendar-today', category: 'Academics' }, // or 'Work' for Corp
      news: { name: 'News', icon: 'campaign', category: 'Social' },
      chat: { name: 'Chat', icon: 'chat', category: 'Social' },
      
      // 2. ORG CONTROLLED - ACADEMIC
      grades: { name: 'Grades', icon: 'analytics', category: 'Academics' },
      assignments: { name: 'Assignments', icon: 'assignment', category: 'Academics' },
      attendance: { name: 'Attendance', icon: 'how-to-reg', category: 'Academics' },
      
      // 3. ORG CONTROLLED - CORPORATE / ADMIN
      finance: { name: 'Finance', icon: 'attach-money', category: 'Productivity' },
      documents: { name: 'Documents', icon: 'folder-shared', category: 'Productivity' },
      tasks: { name: 'Tasks', icon: 'check-circle', category: 'Productivity' },
      
      // 4. ORG CONTROLLED - FACILITIES & SHARED
      map: { name: 'Map', icon: 'map', category: 'Facilities' },
      transport: { name: 'Transport', icon: 'directions-bus', category: 'Facilities' },
      rooms: { name: 'Room Booking', icon: 'meeting-room', category: 'Facilities' },
      events: { name: 'Events', icon: 'event', category: 'Social' },
      users: { name: 'Directory', icon: 'group', category: 'Social' },
    };

    // Apply theme colors to categories
    return Object.fromEntries(Object.entries(baseWidgets).map(([k, v]) => {
      let theme = { bg: colors.tertiary, light: colors.tertiaryLight, text: colors.onTertiary };
      if (v.category === 'Social') theme = { bg: colors.primary, light: colors.primaryLight, text: colors.onPrimary };
      if (v.category === 'Academics' || v.category === 'Facilities') theme = { bg: colors.secondary, light: colors.secondaryLight, text: colors.onSecondary };
      return [k, { ...v, ...theme }];
    }));
  }, [colors]);

  const sortedWidgets = useMemo(() => {
    // Sort by priority (Core -> Academic -> Facility -> Other)
    const getPriority = (id: string) => {
        if (['schedule', 'news'].includes(id)) return 0;
        if (['finance', 'grades'].includes(id)) return 1;
        return 2;
    };
    return widgets.sort((a, b) => getPriority(a) - getPriority(b));
  }, [widgets, widgetConfig]);

  return {
    organization,
    widgets,
    sortedWidgets,
    widgetConfig,
    pinnedWidgets: ['schedule', 'tasks', 'finance', 'grades', 'map'],
    greeting,
    currentDate,
    refreshing, 
    onRefresh
  };
};
