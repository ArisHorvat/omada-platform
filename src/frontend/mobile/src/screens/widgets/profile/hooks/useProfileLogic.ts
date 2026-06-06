import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/context/AuthContext';
import { authApi, orgApi, unwrap, usersApi } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { confirmAction } from '@/src/utils/confirmAction';
import { buildChangeOrganizationParams } from '@/src/utils/organizationSwitchParams';
import type { UserOrganizationDto } from '@/src/api/generatedClient';

export const useProfileLogic = () => {
  const router = useRouter();
  const { activeSession, logout } = useAuth();
  const queryClient = useQueryClient();
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: QUERY_KEYS.userProfile,
    queryFn: async () => await unwrap(usersApi.getMe()),
    enabled: !!activeSession?.orgId,
  });

  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: QUERY_KEYS.organization(activeSession?.orgId || ''),
    queryFn: async () => await unwrap(orgApi.getById(activeSession!.orgId)),
    enabled: !!activeSession?.orgId,
  });

  const { data: myOrganizations = [] } = useQuery({
    queryKey: QUERY_KEYS.myOrganizations,
    queryFn: async () => await unwrap(authApi.getMyOrganizations()),
    enabled: showAccountSwitcher,
  });

  const openOrgSwitcher = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myOrganizations });
    setShowAccountSwitcher(true);
  };

  const handleSwitchOrg = (target: UserOrganizationDto) => {
    if (!target.organizationId || target.isCurrent) return;
    setShowAccountSwitcher(false);
    router.push({
      pathname: '/change-organization',
      params: buildChangeOrganizationParams(target, organization, { animate: true }),
    });
  };

  const handleJoinOrganization = () => {
    setShowAccountSwitcher(false);
    router.push('/join-organization?mode=open' as never);
  };

  const handleLogout = () => {
    confirmAction({
      title: 'Log out',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log out',
      destructive: true,
      onConfirm: () => {
        queryClient.clear();
        void logout().then(() => {
          router.replace('/');
        });
      },
    });
  };

  return {
    user,
    organization,
    isLoading: userLoading || orgLoading,
    showAccountSwitcher,
    setShowAccountSwitcher,
    myOrganizations,
    openOrgSwitcher,
    handleSwitchOrg,
    handleJoinOrganization,
    handleLogout,
    role: activeSession?.role,
    email: activeSession?.email,
  };
};
