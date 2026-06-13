import { useEffect, useRef } from 'react';
import { useGlobalSearchParams, usePathname, useRootNavigationState, useRouter, useSegments } from 'expo-router';

import { useAuth } from '@/src/context/AuthContext';
import { homeHrefForRole } from '@/src/utils/authRoutes';
import { isCompletingLoginOrgPick } from '@/src/utils/loginOrgPick';
import { isCompletingRegistrationSuccess } from '@/src/utils/registrationSuccessFlow';

type GuardMode = 'app' | 'auth';

function normalizeParam(value: string | string[] | undefined): string {
  if (value == null) return '';
  const raw = Array.isArray(value) ? value[0] : value;
  return raw == null || raw === 'null' || raw === 'undefined' ? '' : String(raw).trim();
}

/**
 * Imperative auth redirects for group layouts. Avoid <Redirect /> in _layout files.
 * Loading UI is handled only in root `_layout` (fonts + auth bootstrap).
 */
export function useAuthNavigationGuard(mode: GuardMode) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const searchParams = useGlobalSearchParams<{ code?: string | string[]; token?: string | string[]; email?: string | string[] }>();
  const { activeSession, isLoading } = useAuth();
  const lastRedirectRef = useRef<string | null>(null);

  const navigationReady = Boolean(navigationState?.key);
  const inAppGroup = segments[0] === '(app)';
  const inAuthGroup =
    segments[0] === '(auth)' ||
    pathname === '/' ||
    pathname.startsWith('/login-flow') ||
    pathname.startsWith('/register-flow') ||
    pathname === '/join';
  const isRegistrationFlow = segments[1] === 'register-flow';
  const isRegistrationSuccess =
    pathname.includes('registration-success') || segments.includes('registration-success');
  const isPasswordRecoveryFlow =
    pathname.includes('forgot-password') || pathname.includes('reset-password');
  const superAdminRegistering =
    activeSession?.role === 'SuperAdmin' && isRegistrationFlow;
  const joinCode = normalizeParam(searchParams.code);
  const joinToken = normalizeParam(searchParams.token);
  const joinEmail = normalizeParam(searchParams.email);

  useEffect(() => {
    if (!navigationReady || isLoading) return;

    if (mode === 'app') {
      const onChangeOrg = pathname.includes('change-organization');
      if (!activeSession && (inAppGroup || pathname.startsWith('/org-dashboard')) && !onChangeOrg) {
        const target = '/';
        if (lastRedirectRef.current !== target) {
          lastRedirectRef.current = target;
          router.replace(target as never);
        }
      }
      return;
    }

    if (activeSession && pathname === '/join') {
      const query = new URLSearchParams();
      if (joinCode) query.set('code', joinCode);
      if (joinToken) query.set('token', joinToken);
      if (joinEmail) query.set('email', joinEmail);
      const qs = query.toString();
      const target = qs ? `/join-organization?${qs}` : '/join-organization';
      if (lastRedirectRef.current !== target) {
        lastRedirectRef.current = target;
        router.replace(target as never);
      }
      return;
    }

    if (
      activeSession &&
      inAuthGroup &&
      !isPasswordRecoveryFlow &&
      !superAdminRegistering &&
      !isRegistrationSuccess &&
      !isCompletingRegistrationSuccess() &&
      !isCompletingLoginOrgPick()
    ) {
      const target = homeHrefForRole(activeSession.role);
      if (lastRedirectRef.current !== target) {
        lastRedirectRef.current = target;
        router.replace(target);
      }
    }
  }, [
    mode,
    navigationReady,
    isLoading,
    activeSession,
    superAdminRegistering,
    inAppGroup,
    inAuthGroup,
    pathname,
    router,
    joinCode,
    joinToken,
    joinEmail,
    isRegistrationSuccess,
    isPasswordRecoveryFlow,
  ]);

  useEffect(() => {
    if (!isLoading) {
      lastRedirectRef.current = null;
    }
  }, [isLoading, activeSession?.orgId]);
}
