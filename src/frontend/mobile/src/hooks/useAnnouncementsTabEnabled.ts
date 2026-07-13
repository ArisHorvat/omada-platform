import { WIDGET_KEYS } from '@/src/config/permissions.config';
import { useAuth } from '@/src/context/AuthContext';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { isOrgWidgetEnabled } from '@/src/screens/admin/utils/orgEnabledWidgets';

/**
 * Tab bar / sidebar: show Announcements in the former chat tab slot when the org
 * catalog has it enabled (legacy chat/news toggles count as enabled).
 */
export function useAnnouncementsTabEnabled(): boolean {
  const { activeSession } = useAuth();
  const { organization } = useCurrentOrganization();

  if (!activeSession?.orgId) return false;

  return isOrgWidgetEnabled(
    WIDGET_KEYS.announcements,
    organization?.enabledWidgets,
    organization?.organizationType,
  );
}
