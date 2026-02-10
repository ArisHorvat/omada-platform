import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { PERMISSION_MAP, Capability } from '@/src/config/permissions.config';
import { UserService } from '../services/UserService';

interface PermissionContextType {
  can: (capability: Capability) => boolean;
  refreshPermissions: () => Promise<void>;
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType>({} as PermissionContextType);

export const usePermission = () => useContext(PermissionContext);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeSession, token } = useAuth();
  const [widgetAccess, setWidgetAccess] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const refreshPermissions = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const user = await UserService.getMe();
      // Assuming user object has WidgetAccess or similar logic
      // If WidgetAccess is not on User entity, you might need to fetch it from a specific endpoint
      if ((user as any).widgetAccess) { 
        setWidgetAccess((user as any).widgetAccess);
      }
    } catch (e) {
      console.error("Failed to load permissions", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) refreshPermissions();
  }, [token]);

  const can = (capability: Capability): boolean => {
    if (!activeSession) return false;
    const role = activeSession.role;

    // SuperAdmin / Admin Override
    if (role === 'SuperAdmin' || role === 'Admin') return true;
    
    // Check Widget Permissions
    for (const widgetKey in PERMISSION_MAP) {
        const levels = PERMISSION_MAP[widgetKey];
        const userLevel = widgetAccess[widgetKey];
        
        if (userLevel && levels[userLevel] && levels[userLevel].includes(capability)) {
            return true;
        }
    }
    return false;
  };

  return (
    <PermissionContext.Provider value={{ can, refreshPermissions, isLoading }}>
      {children}
    </PermissionContext.Provider>
  );
};