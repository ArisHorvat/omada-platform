import { useMemo } from 'react';
import { TaskItemDto } from '@/src/api/generatedClient';

export const useTasksFilter = (tasks: TaskItemDto[], activeList: string, showCompleted: boolean) => {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter(t => {
      if (!showCompleted && t.isCompleted) return false;
      if (showCompleted && !t.isCompleted) return false;

      if (activeList === 'All') return true;

      const taskDate = t.dueDate ? new Date(t.dueDate) : null;
      if (taskDate) taskDate.setHours(0, 0, 0, 0);

      if (activeList === 'Overdue') {
        return taskDate && taskDate.getTime() < today.getTime() && !t.isCompleted;
      }
      if (activeList === 'Today') {
        return taskDate && taskDate.getTime() === today.getTime();
      }
      if (activeList === 'Tomorrow') {
        return taskDate && taskDate.getTime() === tomorrow.getTime();
      }
      if (activeList === 'Upcoming') {
        return taskDate && taskDate.getTime() > today.getTime();
      }
      return true;
    }).sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [tasks, activeList, showCompleted]);
};