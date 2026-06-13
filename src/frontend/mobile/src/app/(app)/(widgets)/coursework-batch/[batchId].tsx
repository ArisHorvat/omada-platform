import React from 'react';

import AssignmentBatchGradingScreen from '@/src/screens/admin/assignments-workspace/components/AssignmentBatchGradingScreen';
import { CourseworkTeachingGate } from '@/src/screens/widgets/coursework-teaching/CourseworkTeachingGate';

export default function CourseworkBatchGradingRoute() {
  return (
    <CourseworkTeachingGate>
      <AssignmentBatchGradingScreen />
    </CourseworkTeachingGate>
  );
}
