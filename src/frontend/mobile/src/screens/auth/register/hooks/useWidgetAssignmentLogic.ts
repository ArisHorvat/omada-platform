import { useState, useEffect, useMemo } from 'react';
import { useRegistration } from '@/src/screens/auth/register/context/RegistrationContext';

const ALL_WIDGETS = [
  { id: 'news', name: 'News', icon: 'article', description: 'Announcements' },
  { id: 'chat', name: 'Chat', icon: 'chat', description: 'Messaging' },
  { id: 'schedule', name: 'Schedule', icon: 'calendar-today', description: 'Timetables' },
  { id: 'grades', name: 'Grades', icon: 'school', description: 'Results' },
  { id: 'assignments', name: 'Assignments', icon: 'assignment', description: 'Homework' },
  { id: 'attendance', name: 'Attendance', icon: 'check-circle', description: 'Tracking' },
  { id: 'library', name: 'Library', icon: 'local-library', description: 'Books' },
  { id: 'map', name: 'Map', icon: 'map', description: 'Navigation' },
  { id: 'tasks', name: 'Tasks', icon: 'list-alt', description: 'To-Do' },
  { id: 'users', name: 'Directory', icon: 'people', description: 'Profiles' },
];
const UNIVERSITY_ONLY_WIDGETS = ['grades', 'assignments', 'library'];

export const useWidgetAssignmentLogic = () => {
  const { roles, roleWidgets, setRoleWidgets, orgData } = useRegistration();
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);

  const visibleWidgets = useMemo(() => {
    if (orgData.type === 'corporate') return ALL_WIDGETS.filter(w => !UNIVERSITY_ONLY_WIDGETS.includes(w.id));
    return ALL_WIDGETS;
  }, [orgData.type]);

  useEffect(() => {
    const newRoleWidgets = { ...roleWidgets };
    let hasChanges = false;
    const assign = (rolePart: string, widgets: string[]) => {
      const targetRoles = roles.filter(r => r.toLowerCase().includes(rolePart));
      targetRoles.forEach(role => {
        if (!newRoleWidgets[role]) newRoleWidgets[role] = new Set();
        widgets.forEach(w => { if (visibleWidgets.find(vw => vw.id === w)) newRoleWidgets[role].add(w); });
        hasChanges = true;
      });
    };
    if (orgData.type === 'university') { assign('student', ['news', 'map', 'schedule', 'users', 'grades']); assign('professor', ['news', 'map', 'schedule', 'users', 'attendance']); } 
    else { assign('employee', ['news', 'map', 'tasks', 'users']); assign('team lead', ['news', 'map', 'tasks', 'users', 'chat']); }
    if (hasChanges) setRoleWidgets(newRoleWidgets);
  }, []);

  const isWidgetActive = (id: string) => Object.values(roleWidgets).some(set => set.has(id));
  const toggleWidget = (id: string) => {
    if (isWidgetActive(id)) { const next = { ...roleWidgets }; Object.keys(next).forEach(role => next[role].delete(id)); setRoleWidgets(next); } 
    else setActiveWidgetId(id);
  };
  const toggleRoleForWidget = (role: string, widgetId: string) => {
    const current = roleWidgets[role] || new Set();
    const next = new Set(current);
    if (next.has(widgetId)) next.delete(widgetId); else next.add(widgetId);
    setRoleWidgets({ ...roleWidgets, [role]: next });
  };

  return { visibleWidgets, activeWidgetId, setActiveWidgetId, isWidgetActive, toggleWidget, toggleRoleForWidget, roles, roleWidgets };
};