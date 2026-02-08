import { useState, useEffect, useMemo } from 'react';
import { useRegistration } from '@/src/screens/auth/register/context/RegistrationContext';
import { BASE_WIDGETS } from '@/src/constants/widgets';

// 1. Define Core Widgets (Hidden from wizard, always active)
const CORE_WIDGETS = ['schedule', 'chat', 'news', 'profile', 'dashboard'];

export const useWidgetAssignmentLogic = () => {
  const { roles, roleWidgets, setRoleWidgets, orgData } = useRegistration();
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const orgType = orgData?.type || 'university'; 

  // 2. DYNAMIC FILTERING based on Constants
  const visibleWidgets = useMemo(() => {
    // Convert the Record object to an Array: [{ id: 'grades', name: 'Grades', ... }, ...]
    return Object.entries(BASE_WIDGETS)
      .map(([key, def]) => ({ id: key, ...def })) // Flatten ID into the object
      .filter(w => {
        // Filter out Core widgets (they are auto-assigned)
        if (CORE_WIDGETS.includes(w.id)) return false;

        // Logic: Show if availability matches OrgType OR availability is 'all'
        if (w.availability === 'all') return true;
        return w.availability === orgType;
      });
  }, [orgType]);

  // 3. Auto-Assign Defaults
  useEffect(() => {
    const newRoleWidgets: Record<string, Set<string>> = {};

    const assign = (roleName: string, widgetIds: string[]) => {
      // Case insensitive role matching
      const targetRole = roles.find(r => r.toLowerCase() === roleName.toLowerCase());
      
      if (targetRole) {
         if (!newRoleWidgets[targetRole]) newRoleWidgets[targetRole] = new Set();
         
         widgetIds.forEach(w => {
             // Only add if it exists in our system
             if (BASE_WIDGETS[w]) {
                 newRoleWidgets[targetRole].add(w);
             }
         });
      }
    };

    // --- APPLY DEFAULTS ---
    // Everyone gets Core
    roles.forEach(r => assign(r, CORE_WIDGETS));

    // Specific Defaults (Using IDs from widgets.ts)
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

    if (Object.keys(newRoleWidgets).length > 0) {
        setRoleWidgets(newRoleWidgets);
    }
  }, [orgType, roles]);

  // Toggle Logic
  const isWidgetActive = (id: string) => Object.values(roleWidgets).some(set => set.has(id));
  
  const toggleRoleForWidget = (role: string, widgetId: string) => {
    const current = roleWidgets[role] || new Set();
    const next = new Set(current);
    if (next.has(widgetId)) next.delete(widgetId);
    else next.add(widgetId);
    
    setRoleWidgets(prev => ({ ...prev, [role]: next }));
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