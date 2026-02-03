import { useState, useEffect, useMemo } from 'react';
import { useRegistration } from '@/src/screens/auth/register/context/RegistrationContext';

// 1. CORE WIDGETS (Always enabled, hidden in wizard)
const CORE_WIDGETS = ['schedule', 'chat', 'news', 'profile', 'dashboard'];

// 2. MASTER LIST (Strictly separated by Org Type)
const AVAILABLE_WIDGETS = [
  // University Specific
  { id: 'grades', name: 'Grades', icon: 'analytics', type: 'university' },
  { id: 'assignments', name: 'Assignments', icon: 'assignment', type: 'university' },
  { id: 'attendance', name: 'Attendance', icon: 'how-to-reg', type: 'university' },
  
  // Corporate Specific
  { id: 'finance', name: 'Finance', icon: 'attach-money', type: 'corporate' },
  { id: 'documents', name: 'Documents', icon: 'folder-shared', type: 'corporate' },
  
  // Shared
  { id: 'tasks', name: 'Tasks', icon: 'check-circle', type: 'shared' },
  { id: 'map', name: 'Map', icon: 'map', type: 'shared' },
  { id: 'rooms', name: 'Room Booking', icon: 'meeting-room', type: 'shared' },
  { id: 'events', name: 'Events', icon: 'event', type: 'shared' },
  { id: 'transport', name: 'Transport', icon: 'directions-bus', type: 'shared' },
  { id: 'users', name: 'Directory', icon: 'group', type: 'shared' },
];

export const useWidgetAssignmentLogic = () => {
  // --- KEEPING YOUR REQUESTED PART ---
  const { roles, roleWidgets, setRoleWidgets, orgData } = useRegistration();
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const orgType = orgData?.type || 'university'; 
  // -----------------------------------

  // 1. Filter Widgets based on Org Type
  const visibleWidgets = useMemo(() => {
    return AVAILABLE_WIDGETS.filter(w => {
      if (w.type === 'shared') return true;
      return w.type === orgType;
    });
  }, [orgType]);

  // 2. Auto-Assign Defaults when Roles Change
  useEffect(() => {
    const newRoleWidgets: Record<string, Set<string>> = {};
    let hasChanges = false;

    const assign = (roleName: string, widgets: string[]) => {
      // Find matching role in the Context's roles array (Case Insensitive)
      const targetRole = roles.find(r => r.toLowerCase() === roleName.toLowerCase());
      
      if (targetRole) {
         if (!newRoleWidgets[targetRole]) newRoleWidgets[targetRole] = new Set();
         widgets.forEach(w => {
             // Only add if it's in our visible list OR it's a core widget
             if (visibleWidgets.find(vw => vw.id === w) || CORE_WIDGETS.includes(w)) {
                 newRoleWidgets[targetRole].add(w);
             }
         });
         hasChanges = true;
      }
    };

    // --- APPLY DEFAULTS ---
    // Everyone gets Core
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

    // Only update if we generated a map different from empty
    if (Object.keys(newRoleWidgets).length > 0) {
        setRoleWidgets(newRoleWidgets);
    }
  }, [orgType, roles]); // Re-run if roles array changes (e.g. user went back and swapped Org Type)

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
    roles, // Passing context roles back to UI
    roleWidgets
  };
};