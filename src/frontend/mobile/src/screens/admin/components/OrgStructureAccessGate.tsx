import React from 'react';
import { Redirect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { usersApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useAuth } from '@/src/context/AuthContext';
import { canAccessOrgStructure } from '@/src/utils/orgAdminAccess';

type Props = {
  children: React.ReactNode;
};

/** Blocks periods / offerings workspaces for non–org-admins. */
export function OrgStructureAccessGate({ children }: Props) {
  const { activeSession, token } = useAuth();
  const { data: user } = useQuery({
    queryKey: QUERY_KEYS.userProfile,
    queryFn: () => unwrap(usersApi.getMe()),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const allowed = canAccessOrgStructure(activeSession?.role, user?.widgetAccess);

  if (!allowed) {
    return <Redirect href="/org-dashboard" />;
  }

  return <>{children}</>;
}
