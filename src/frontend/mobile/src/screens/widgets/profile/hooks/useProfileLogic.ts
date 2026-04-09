import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/context/AuthContext';
import { authApi, orgApi, unwrap, usersApi } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';

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

  const openOrgSwitcher = () => setShowAccountSwitcher(true);

  const handleSwitchOrg = (
    targetOrgId: string,
    targetOrgName: string,
    targetLogoUrl?: string,
    targetOrgType?: string,
    targetRole?: string
  ) => {
    if (!targetOrgId) return;
    router.push({
      pathname: '/change-organization',
      params: {
        targetOrgId,
        targetOrgName: targetOrgName || 'Organization',
        targetLogoUrl: targetLogoUrl || '',
        targetOrgType: targetOrgType ?? '',
        targetRole: targetRole ?? '',
        currentOrgColor: organization?.primaryColor || '#000000',
        currentOrgLogo: organization?.logoUrl || '',
      },
    });
    setTimeout(() => setShowAccountSwitcher(false), 400);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          queryClient.clear();
          void logout();
        },
      },
    ]);
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
    handleLogout,
    role: activeSession?.role,
    email: activeSession?.email,
  };
};
