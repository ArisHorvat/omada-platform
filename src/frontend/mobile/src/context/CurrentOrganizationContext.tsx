import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { orgApi, unwrap } from '@/src/api';
import { OrganizationDetailsDto } from '@/src/api/generatedClient';
import { resolveMediaUrl } from '@/src/utils/resolveMediaUrl';

function withResolvedOrgMedia(org: OrganizationDetailsDto): OrganizationDetailsDto {
  const logoUrl = resolveMediaUrl(org.logoUrl);
  return logoUrl ? { ...org, logoUrl } : org;
}

interface CurrentOrganizationContextType {
  organization: OrganizationDetailsDto | null;
  isLoading: boolean;
  refreshOrganization: () => Promise<void>;
}

const CurrentOrganizationContext = createContext<CurrentOrganizationContextType>({} as CurrentOrganizationContextType);

export const useCurrentOrganization = () => useContext(CurrentOrganizationContext);

export const CurrentOrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeSession } = useAuth();
  const [organization, setOrganization] = useState<OrganizationDetailsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Re-fetch data whenever the user switches organizations
  useEffect(() => {
    if (activeSession?.orgId) {
      setOrganization((prev) => (prev?.id === activeSession.orgId ? prev : null));
      loadOrganizationData(activeSession.orgId);
    } else {
      setOrganization(null);
    }
  }, [activeSession?.orgId]);

  const loadOrganizationData = async (orgId: string) => {
    const CACHE_KEY = `org_data_${orgId}`;

    // 1. FAST LOAD: Check AsyncStorage first
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);

      if (cachedData) {
        setOrganization(withResolvedOrgMedia(JSON.parse(cachedData) as OrganizationDetailsDto));
      } else {
        // Only show loading spinner if we have NO cache
        setIsLoading(true);
      }
    } catch (e) {
      console.error("Failed to read org cache", e);
    }

    // 2. BACKGROUND REVALIDATE: Fetch fresh data from API
    try {
      const freshData = await unwrap(orgApi.getById(orgId));
      
      const resolved = withResolvedOrgMedia(freshData);
      setOrganization(resolved);

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(resolved));
    } catch (e) {
      console.error("Failed to fetch fresh org data", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose a manual refresh method in case a user pulls-to-refresh on the dashboard
  const refreshOrganization = async () => {
    if (activeSession?.orgId) {
      await loadOrganizationData(activeSession.orgId);
    }
  };

  return (
    <CurrentOrganizationContext.Provider value={{ organization, isLoading, refreshOrganization }}>
      {children}
    </CurrentOrganizationContext.Provider>
  );
};