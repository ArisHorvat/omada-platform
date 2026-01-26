import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useUserPreferences } from '@/src/context/UserPreferencesContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { CurrentOrganizationService } from '@/src/services/CurrentOrganizationService';
import { Organization } from '@/src/types';

export const useDashboardLogic = () => {
  const { role } = useAuth();
  const colors = useThemeColors();
  const { pinnedWidgets } = useUserPreferences();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [widgets, setWidgets] = useState<string[]>([]);
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');

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
    const baseWidgets: Record<string, { name: string; icon: keyof typeof MaterialIcons.glyphMap; category: string }> = {
      news: { name: 'News', icon: 'article', category: 'Campus Life' },
      schedule: { name: 'Schedule', icon: 'calendar-today', category: 'Academics' },
      grades: { name: 'Grades', icon: 'school', category: 'Academics' },
      assignments: { name: 'Assignments', icon: 'assignment', category: 'Academics' },
      attendance: { name: 'Attendance', icon: 'check-circle', category: 'Academics' },
      library: { name: 'Library', icon: 'menu-book', category: 'Academics' },
      digital_id: { name: 'Digital ID', icon: 'badge', category: 'Admin' },
      tuition: { name: 'Tuition', icon: 'payment', category: 'Admin' },
      directory: { name: 'Directory', icon: 'supervisor-account', category: 'Social' },
      map: { name: 'Map', icon: 'map', category: 'Campus Life' },
      room_booking: { name: 'Room Booking', icon: 'meeting-room', category: 'Facilities' },
      parking: { name: 'Parking', icon: 'local-parking', category: 'Facilities' },
      chat: { name: 'Chat', icon: 'chat', category: 'Social' },
      tasks: { name: 'Tasks', icon: 'list-alt', category: 'Productivity' },
      users: { name: 'Users', icon: 'people', category: 'Social' },
    };

    // Apply theme colors to categories
    return Object.fromEntries(Object.entries(baseWidgets).map(([k, v]) => {
      let theme = { bg: colors.tertiary, light: colors.tertiaryLight, text: colors.onTertiary };
      if (v.category === 'Campus Life' || v.category === 'Social') theme = { bg: colors.primary, light: colors.primaryLight, text: colors.onPrimary };
      if (v.category === 'Academics' || v.category === 'Facilities') theme = { bg: colors.secondary, light: colors.secondaryLight, text: colors.onSecondary };
      return [k, { ...v, ...theme }];
    }));
  }, [colors]);

  const sortedWidgets = useMemo(() => {
    const getPriority = (id: string) => {
      const cat = widgetConfig[id]?.category;
      if (cat === 'Campus Life' || cat === 'Social') return 1;
      if (cat === 'Academics' || cat === 'Facilities') return 2;
      return 3;
    };
    return [...widgets].sort((a, b) => getPriority(a) - getPriority(b));
  }, [widgets, widgetConfig]);

  return {
    organization,
    widgets,
    sortedWidgets,
    widgetConfig,
    pinnedWidgets,
    greeting,
    currentDate,
  };
};
