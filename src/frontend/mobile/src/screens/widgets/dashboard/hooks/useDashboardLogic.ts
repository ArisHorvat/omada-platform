import { useMemo } from 'react';
import { useUserPreferences } from '@/src/context/UserPreferencesContext';
import { useDashboardData } from './useDashboardData';
import { useDashboardMeta } from './useDashboardMeta';
import { useDashboardConfig } from './useDashboardConfig';
import { BASE_WIDGETS } from '@/src/constants/widgets';

export const useDashboardLogic = () => {
  // 1. Get Data from sub-hooks
  const { organization, widgets, refreshing, onRefresh } = useDashboardData();
  const { greeting, currentDate } = useDashboardMeta();
  const definitions = useDashboardConfig();
  
  // 2. Get User Preferences
  const { favoriteWidgets, updateFavoriteWidgets } = useUserPreferences();

  // 3. Sorting Logic
  const sortedWidgets = useMemo(() => {
    return [...widgets].sort((a, b) => {
      const priorityA = BASE_WIDGETS[a]?.priority ?? 99;
      const priorityB = BASE_WIDGETS[b]?.priority ?? 99;
      return priorityA - priorityB;
    });
  }, [widgets]);

  // 4. Return GROUPED API (The Facade Structure)
  return {
    // Namespace 1: Meta (Time, Greetings)
    meta: {
      greeting,
      currentDate,
    },

    // Namespace 2: Core Data (Org, Widgets, Refresh)
    data: {
      organization,
      allWidgets: widgets,      // Raw list
      sortedWidgets,            // Sorted list for UI
      refreshing,
      onRefresh,
    },

    // Namespace 3: Configuration (Colors, Icons)
    config: {
      definitions
    },

    // Namespace 4: User Actions (Favorites)
    user: {
      favorites: favoriteWidgets,
      updateFavorites: updateFavoriteWidgets,
    }
  };
};