import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { OrganizationDetailsDto } from '@/src/api/generatedClient';
import { orgApi, unwrap } from '@/src/api';

export const useSuperAdminDashboardLogic = () => {
  const { logout } = useAuth(); // Use proper logout action
  const [organizations, setOrganizations] = useState<OrganizationDetailsDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);

  const loadOrganizations = async () => {
    setIsLoading(true);
    try {
      // Look here! Pass the primitive values directly to the generated client
      const response = await unwrap(orgApi.getAll(page, pageSize));
      
      // Update state with the nested PagedResponse data
      setOrganizations(response.items || []);
      setTotalItems(response.totalCount || 0);
    } catch (error) {
      console.error("Failed to load orgs", error);
      // TODO: Show an error toast to the user
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Trigger Fetch on Mount AND when pagination changes
  useEffect(() => {
    loadOrganizations();
  }, [page, pageSize]);

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
                    // await OrganizationService.delete(id);
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
    // refresh: loadOrganizations
  };
};