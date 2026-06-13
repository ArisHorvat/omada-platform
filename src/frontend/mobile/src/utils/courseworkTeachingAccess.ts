import type { Capability } from '@/src/config/permissions.config';

/** Teachers: post/grade coursework (assignments Edit). Students only submit (View). */
export function canTeachCoursework(can: (capability: Capability) => boolean): boolean {
  return can('assignments.grade');
}
