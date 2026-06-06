import { useEffect, useRef } from 'react';
import { usePathname, useRootNavigationState, useRouter } from 'expo-router';

import { useAuth } from '@/src/context/AuthContext';
import {
  isAllowedOrgAdminPath,
  shouldLockOrgAdminToConsole,
} from '@/src/utils/orgAdminRoutes';

/**
 * Keeps organization admins in the admin console — not the member dashboard/widgets.
 */
export function useOrgAdminNavigationGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const navigationState = useRootNavigationState();
  const { activeSession, isLoading } = useAuth();
  const lastRedirectRef = useRef<string | null>(null);

  const navigationReady = Boolean(navigationState?.key);
  const role = activeSession?.role;

  useEffect(() => {
    if (!navigationReady || isLoading || !activeSession) return;
    if (!shouldLockOrgAdminToConsole(role)) return;
    if (isAllowedOrgAdminPath(pathname, role)) return;

    const target = '/org-dashboard';
    if (lastRedirectRef.current !== target) {
      lastRedirectRef.current = target;
      router.replace(target as never);
    }
  }, [navigationReady, isLoading, activeSession, role, pathname, router]);

  useEffect(() => {
    if (!isLoading) {
      lastRedirectRef.current = null;
    }
  }, [isLoading, activeSession?.orgId]);
}
