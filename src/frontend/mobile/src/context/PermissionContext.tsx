import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { PERMISSION_MAP, Capability, AccessLevel } from '@/src/config/permissions.config';
import { usersApi, unwrap } from '@/src/api'; 
import { QUERY_KEYS } from '@/src/api/queryKeys';

interface PermissionContextType {
  can: (capability: Capability) => boolean;
  refreshPermissions: () => Promise<void>;
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType>({} as PermissionContextType);
export const usePermission = () => useContext(PermissionContext);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeSession, token } = useAuth();

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.userProfile,
    queryFn: async () => await unwrap(usersApi.getMe()),
    enabled: !!token, // Only run if logged in
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const widgetAccess = user?.widgetAccess || {};

  const can = (capability: Capability): boolean => {
    if (!activeSession) return false;
    const r = activeSession.role?.trim() ?? '';
    if (r === 'SuperAdmin' || r === 'Super Admin' || r === 'Admin') return true;

    const widgetKey = capability.split('.')[0];
    const userLevel = widgetAccess[widgetKey] as AccessLevel;
    if (!userLevel) return false;

    const allowedCapabilities = PERMISSION_MAP[widgetKey as keyof typeof PERMISSION_MAP]?.[userLevel];
    return allowedCapabilities ? allowedCapabilities.includes(capability) : false;
  };

  return (
    <PermissionContext.Provider value={{ can, refreshPermissions: async () => { await refetch(); }, isLoading }}>
      {children}
    </PermissionContext.Provider>
  );
};