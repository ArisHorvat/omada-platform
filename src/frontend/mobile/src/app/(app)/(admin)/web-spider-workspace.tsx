import { Redirect } from 'expo-router';

/** Legacy route — schedule import lives under Timetables → Import. */
export default function WebSpiderWorkspaceRedirect() {
  return <Redirect href="/timetables-workspace?tab=import" />;
}
