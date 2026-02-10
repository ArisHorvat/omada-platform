import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { OrganizationService } from '@/src/services/OrganizationService';
import { OrganizationDetailsDto } from '@/src/types/api';

export const useSuperAdminDashboardLogic = () => {
  const { logout } = useAuth(); // Use proper logout action
  const [organizations, setOrganizations] = useState<OrganizationDetailsDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Data on Mount
  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setIsLoading(true);
    try {
      const data = await OrganizationService.getAll();
      setOrganizations(data);
    } catch (error) {
      console.error("Failed to load orgs", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: logout }
      ]
    );
  };

  const deleteOrganization = async (id: string) => {
    Alert.alert("Delete Organization", "This action cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        { 
            text: "Delete", 
            style: "destructive", 
            onPress: async () => {
                try {
                    await OrganizationService.delete(id);
                    // Refresh local list
                    setOrganizations(prev => prev.filter(o => o.id !== id));
                } catch (e) {
                    Alert.alert("Error", "Failed to delete organization");
                }
            } 
        }
    ]);
  };

  const filteredOrganizations = useMemo(() => {
    if (!searchQuery) return organizations;
    const lower = searchQuery.toLowerCase();
    return organizations.filter(org => 
      (org.name && org.name.toLowerCase().includes(lower)) || 
      (org.emailDomain && org.emailDomain.toLowerCase().includes(lower))
    );
  }, [organizations, searchQuery]);

  return {
    organizations: filteredOrganizations,
    searchQuery,
    setSearchQuery,
    handleLogout,
    deleteOrganization,
    isLoading,
    refresh: loadOrganizations
  };
};