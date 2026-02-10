import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { OrganizationService } from '@/src/services/OrganizationService';
import { OrganizationDetailsDto } from '@/src/types/api';

export const useOrgAdminDashboardLogic = () => {
  const { activeSession, logout } = useAuth();
  const [org, setOrg] = useState<OrganizationDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrg = async () => {
        if (!activeSession?.orgId) return;
        try {
            const data = await OrganizationService.getById(activeSession.orgId);
            setOrg(data);
        } catch (e) {
            console.error("Failed to load admin dashboard", e);
        } finally {
            setLoading(false);
        }
    };
    loadOrg();
  }, [activeSession?.orgId]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout }
    ]);
  };

  const handleFeatureComingSoon = (feature: string) => 
      Alert.alert('Coming Soon', `${feature} will be available soon.`);

  return {
    org,
    loading,
    handleLogout,
    handleFeatureComingSoon
  };
};