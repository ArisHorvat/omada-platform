import { Redirect, type Href } from 'expo-router';

/** Legacy alias — coursework workspace in admin console. */
export default function TasksWorkspaceRedirect() {
  return <Redirect href={'/assignments-workspace' as Href} />;
}
