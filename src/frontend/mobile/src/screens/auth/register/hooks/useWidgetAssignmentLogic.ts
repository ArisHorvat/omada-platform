import { useState, useEffect, useMemo } from 'react';
import { useRegistrationContext } from '@/src/screens/auth/register/context/RegistrationContext';
import { BASE_WIDGETS } from '@/src/constants/widgets';

// 1. Define Core Widgets (Hidden from wizard, always active)
const CORE_WIDGETS = ['schedule', 'chat', 'news', 'profile', 'dashboard'];

export const useWidgetAssignmentLogic = () => {
  const { roles, roleWidgets, setRoleWidgets, orgData } = useRegistrationContext();
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const orgType = orgData?.type || 'university'; 

  // 2. DYNAMIC FILTERING based on Constants
  const visibleWidgets = useMemo(() => {
    return Object.entries(BASE_WIDGETS)
      .map(([key, def]) => ({ id: key, ...def }))
      .filter(w => {
        if (CORE_WIDGETS.includes(w.id)) return false;
        if (w.availability === 'all') return true;
        return w.availability === orgType;
      });
  }, [orgType]);

  // 3. Auto-Assign Defaults
  useEffect(() => {
    // Only run this if we have roles but no widgets assigned yet (or to reset on orgType change)
    // We create a fresh object here
    const newRoleWidgets: Record<string, Set<string>> = {};

    const assign = (roleName: string, widgetIds: string[]) => {
      const targetRole = roles.find(r => r.toLowerCase() === roleName.toLowerCase());
      if (targetRole) {
         if (!newRoleWidgets[targetRole]) newRoleWidgets[targetRole] = new Set();
         widgetIds.forEach(w => {
             // Only add known widgets or core widgets
             if (BASE_WIDGETS[w] || CORE_WIDGETS.includes(w)) {
                 newRoleWidgets[targetRole].add(w);
             }
         });
      }
    };

    // --- APPLY DEFAULTS ---
    roles.forEach(r => assign(r, CORE_WIDGETS));

    if (orgType === 'university') {
        assign('Student', ['grades', 'assignments', 'attendance', 'map', 'transport', 'events', 'documents', 'rooms']);
        assign('Professor', ['grades', 'assignments', 'attendance', 'users', 'transport']);
        assign('Teaching Assistant', ['grades', 'assignments', 'attendance']);
        assign('Dean', ['news', 'users', 'map']);
        assign('Registrar', ['grades', 'attendance', 'documents', 'users']);
        assign('Operations', ['map', 'transport', 'rooms', 'events']);
    } else {
        assign('Employee', ['tasks', 'documents', 'finance', 'map', 'rooms']);
        assign('Team Lead', ['tasks', 'users', 'rooms', 'chat']);
        assign('Project Manager', ['tasks', 'documents', 'finance', 'users']);
        assign('Director', ['finance', 'news', 'users']);
        assign('HR Manager', ['documents', 'users', 'finance', 'news']);
        assign('Operations', ['map', 'transport', 'rooms']);
    }

    // Only update if we generated keys
    if (Object.keys(newRoleWidgets).length > 0) {
        setRoleWidgets(newRoleWidgets);
    }
  }, [orgType, roles]); // Be careful: adding 'setRoleWidgets' here might cause infinite loops if the context isn't memoized

  // Toggle Logic
  const isWidgetActive = (id: string) => {
    // Check if ANY role has this widget enabled
    return Object.values(roleWidgets).some(set => set.has(id));
  };
  
  const toggleRoleForWidget = (role: string, widgetId: string) => {
    const currentSet = roleWidgets[role] || new Set();
    const nextSet = new Set(currentSet);
    
    if (nextSet.has(widgetId)) {
        nextSet.delete(widgetId);
    } else {
        nextSet.add(widgetId);
    }
    
    // FIX IS HERE: Use 'roleWidgets' from context, NOT 'prev' function
    setRoleWidgets({ 
        ...roleWidgets, 
        [role]: nextSet 
    });
  };

  return {
    visibleWidgets,
    activeWidgetId,
    setActiveWidgetId,
    isWidgetActive,
    toggleRoleForWidget,
    roles, 
    roleWidgets
  };
};