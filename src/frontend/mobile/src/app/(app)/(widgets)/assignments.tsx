import { Redirect } from 'expo-router';

/** Legacy route — coursework lives on the unified Tasks tab. */
export default function AssignmentsRoute() {
  return <Redirect href="/tasks" />;
}
