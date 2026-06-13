import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/src/context/AuthContext';
import { isOrgAdminRole } from '@/src/utils/authRoutes';

export type OrgAdminExperienceMode = 'console' | 'member';

type OrgAdminExperienceContextValue = {
  mode: OrgAdminExperienceMode;
  openAdminConsole: () => void;
  openMemberApp: () => void;
  /** True when org admins are locked to the admin console (not browsing as a member). */
  isConsoleLocked: boolean;
};

const OrgAdminExperienceContext = createContext<OrgAdminExperienceContextValue | null>(null);

export function OrgAdminExperienceProvider({ children }: { children: React.ReactNode }) {
  const { activeSession } = useAuth();
  const role = activeSession?.role;
  const [mode, setMode] = useState<OrgAdminExperienceMode>('console');

  useEffect(() => {
    setMode(isOrgAdminRole(role) ? 'console' : 'member');
  }, [activeSession?.orgId, role]);

  const openAdminConsole = useCallback(() => setMode('console'), []);
  const openMemberApp = useCallback(() => setMode('member'), []);

  const isConsoleLocked = isOrgAdminRole(role) && mode === 'console';

  const value = useMemo(
    () => ({
      mode,
      openAdminConsole,
      openMemberApp,
      isConsoleLocked,
    }),
    [mode, openAdminConsole, openMemberApp, isConsoleLocked],
  );

  return (
    <OrgAdminExperienceContext.Provider value={value}>{children}</OrgAdminExperienceContext.Provider>
  );
}

export function useOrgAdminExperience(): OrgAdminExperienceContextValue {
  const ctx = useContext(OrgAdminExperienceContext);
  if (!ctx) {
    throw new Error('useOrgAdminExperience must be used within OrgAdminExperienceProvider');
  }
  return ctx;
}
