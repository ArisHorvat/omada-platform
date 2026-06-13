import React from 'react';

import AssignmentsWorkspaceScreen from '@/src/screens/admin/assignments-workspace/AssignmentsWorkspaceScreen';
import { CourseworkTeachingGate } from '@/src/screens/widgets/coursework-teaching/CourseworkTeachingGate';

/** Member-app teaching workspace — post/grade coursework for courses on your teaching team. */
export default function CourseworkTeachingRoute() {
  return (
    <CourseworkTeachingGate>
      <AssignmentsWorkspaceScreen mode="member" />
    </CourseworkTeachingGate>
  );
}
