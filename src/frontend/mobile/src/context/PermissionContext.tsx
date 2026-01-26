import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { PERMISSION_MAP, ALL_CAPABILITIES, Capability } from '@/src/config/permissions.config';
import { UserService } from '../services/UserService';

interface PermissionContextType {
  can: (capability: Capability) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType>({} as PermissionContextType);

export const usePermission = () => useContext(PermissionContext);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, token } = useAuth();
  const [widgetAccess, setWidgetAccess] = useState<Record<string, string>>({});

  const refreshPermissions = async () => {
    if (!token) return;
    try {
      const user = await UserService.getMe();
      if (user.WidgetAccess) {
        setWidgetAccess(user.WidgetAccess);
      }
    } catch (e) {
      console.error("Failed to load permissions", e);
    }
  };

  useEffect(() => {
    refreshPermissions();
  }, [token]);

  const can = (capability: Capability): boolean => {
    if (!role) return false;
    if (role === 'SuperAdmin' || role === 'Admin') return true;
    
    // 1. Identify which widget this capability belongs to
    // (In a real app, you might pass widgetId to can(), but here we search)
    for (const widgetKey in PERMISSION_MAP) {
        const levels = PERMISSION_MAP[widgetKey];
        
        // 2. Check if user has an access level for this widget
        const userLevel = widgetAccess[widgetKey];
        if (userLevel && levels[userLevel]) {
            // 3. Check if that level grants the capability
            if (levels[userLevel].includes(capability)) {
                return true;
            }
        }
    }

    return false;
  };

  return (
    <PermissionContext.Provider value={{ can, refreshPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
};