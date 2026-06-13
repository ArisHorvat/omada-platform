import type { Router } from 'expo-router';
import type { TaskItemDto } from '@/src/api/generatedClient';

export function openAssignmentDetail(router: Router, task: TaskItemDto): void {
  router.push({
    pathname: '/assignment/[id]',
    params: { id: task.id },
  } as never);
}
