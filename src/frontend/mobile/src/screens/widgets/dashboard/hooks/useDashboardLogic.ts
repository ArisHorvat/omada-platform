import { useMemo, useState } from 'react';
import { startOfDay, endOfDay, isToday, isSameDay } from 'date-fns';
import { useUserPreferences } from '@/src/context/UserPreferencesContext';
import { useDashboardData } from './useDashboardData';
import { useDashboardMeta } from './useDashboardMeta';
import { useDashboardConfig } from './useDashboardConfig';
import { BASE_WIDGETS } from '@/src/constants/widgets';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { NewsItemDto, ScheduleItemDto, TaskItemDto } from '@/src/api/generatedClient';

export const useDashboardLogic = (highlightDay?: Date) => {
  const [defaultHighlightDay] = useState(() => startOfDay(new Date()));
  const dayAnchor = highlightDay ?? defaultHighlightDay;

  // 1. Get Data from sub-hooks
  const { organization, widgets, refreshing, onRefresh } = useDashboardData();
  const { greeting, currentDate } = useDashboardMeta();
  const definitions = useDashboardConfig();
  const queryClient = useQueryClient();
  const { organization: currentOrg } = useCurrentOrganization();
  
  // 2. Get User Preferences
  const { favoriteWidgets, updateFavoriteWidgets } = useUserPreferences();
  const [isEditing, setIsEditing] = useState(false);

  // 3. Sorting Logic
  const sortedWidgets = useMemo(() => {
    return [...widgets].sort((a, b) => {
      const priorityA = BASE_WIDGETS[a]?.priority ?? 99;
      const priorityB = BASE_WIDGETS[b]?.priority ?? 99;
      return priorityA - priorityB;
    });
  }, [widgets]);

  const highlights = useMemo(() => {
    const orgId = currentOrg?.id;
    const available = new Set(widgets);
    const result: string[] = [];

    const dayStart = startOfDay(dayAnchor);
    const dayEnd = endOfDay(dayAnchor);

    const scheduleRows = orgId
      ? queryClient.getQueriesData<ScheduleItemDto[]>({ queryKey: ['schedule', orgId] })
      : [];
    const scheduleEvents = scheduleRows.flatMap(([, data]) => (Array.isArray(data) ? data : []));

    const eventsOnDay = scheduleEvents.filter((e) => {
      const t = new Date(e.startTime);
      return t >= dayStart && t <= dayEnd;
    });

    const now = Date.now();
    const tenMinMs = 10 * 60 * 1000;
    const hasUpcomingClassInTenMin =
      isToday(dayAnchor) &&
      scheduleEvents.some((e) => {
        const start = new Date(e.startTime).getTime();
        return start >= now && start - now <= tenMinMs;
      });

    if (available.has('schedule')) {
      if (hasUpcomingClassInTenMin) {
        result.push('schedule');
      } else if (eventsOnDay.length > 0) {
        result.push('schedule');
      }
    }

    const taskRows = orgId
      ? queryClient.getQueriesData<TaskItemDto[]>({ queryKey: ['tasks', orgId] })
      : [];
    const tasksFlat = taskRows.flatMap(([, data]) => (Array.isArray(data) ? data : []));
    const hasTaskDueOnDay = tasksFlat.some(
      (t) => t.dueDate && isSameDay(new Date(t.dueDate), dayAnchor) && !t.isCompleted
    );
    if (hasTaskDueOnDay && available.has('tasks') && !result.includes('tasks')) {
      result.push('tasks');
    }

    const newsRows = orgId
      ? queryClient.getQueriesData<{ items?: NewsItemDto[] } | NewsItemDto[]>({ queryKey: ['news', orgId] })
      : [];
    const newsItems = newsRows.flatMap(([, data]) => {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray((data as { items?: NewsItemDto[] }).items)) {
        return (data as { items?: NewsItemDto[] }).items || [];
      }
      return [];
    });

    const hasUnreadNews = newsItems.length > 0;
    if (hasUnreadNews && available.has('news') && !result.includes('news')) {
      result.push('news');
    }

    // Favorites are independent of highlights. When the cache has no schedule/tasks/news yet,
    // smart signals alone can be empty — backfill from org widget priority (same order as All Apps).
    const MAX_HIGHLIGHTS = 5;
    for (const id of sortedWidgets) {
      if (result.length >= MAX_HIGHLIGHTS) break;
      if (!result.includes(id)) result.push(id);
    }

    return result;
  }, [currentOrg?.id, dayAnchor, queryClient, widgets, sortedWidgets]);

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
      highlights,
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
      isEditing,
      setIsEditing,
      onLongPressWidget: () => setIsEditing(true),
    }
  };
};