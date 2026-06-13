import React from 'react';

import AssignmentsWorkspaceScreen from '@/src/screens/admin/assignments-workspace/AssignmentsWorkspaceScreen';

/** Admin console — post coursework to any offering in the selected term (org admins). */
export default function AdminAssignmentsWorkspaceRoute() {
  return <AssignmentsWorkspaceScreen mode="admin" />;
}
