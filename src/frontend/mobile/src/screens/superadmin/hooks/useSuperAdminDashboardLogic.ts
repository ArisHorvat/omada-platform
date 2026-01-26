import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { OrganizationService } from '@/src/services/OrganizationService';

export const useSuperAdminDashboardLogic = () => {
  const { setToken } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = OrganizationService.subscribe(
      (data, offline) => {
        setOrganizations(data);
        setIsOffline(offline);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => setToken(null) }
      ]
    );
  };

  const deleteOrganization = async (id: string) => {
    await OrganizationService.delete(id);
  };

  const filteredOrganizations = useMemo(() => {
    if (!searchQuery) return organizations;
    const lower = searchQuery.toLowerCase();
    return organizations.filter(org => 
      (org.name && org.name.toLowerCase().includes(lower)) || 
      (org.emailDomain && org.emailDomain.toLowerCase().includes(lower))
    );
  }, [organizations, searchQuery]);

  return { filteredOrganizations, isOffline, searchQuery, setSearchQuery, handleLogout, deleteOrganization };
};