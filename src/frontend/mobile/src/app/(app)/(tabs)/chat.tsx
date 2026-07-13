import { Redirect } from 'expo-router';

/** Legacy tab route — announcements replaced org chat. */
export default function ChatRedirect() {
  return <Redirect href="/announcements" />;
}
