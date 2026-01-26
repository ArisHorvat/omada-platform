import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '@/src/context/AuthContext';
import { OrganizationService } from '@/src/services/OrganizationService';

export const useOrgAdminDashboardLogic = () => {
  const { email, setToken, token } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = OrganizationService.subscribe((data) => {
      if (token) {
        try {
            const decoded: any = jwtDecode(token);
            const myOrg = data.find(o => o.id === decoded.organizationId);
            setOrg(myOrg);
        } catch (e) {
            console.error("Failed to decode token", e);
        }
        setLoading(false); 
      }
    });
    return () => unsubscribe();
  }, [token]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => setToken(null) }
    ]);
  };

  const handleFeatureComingSoon = (feature: string) => Alert.alert('Coming Soon', `${feature} will be available soon.`);

  return { org, loading, email, handleLogout, handleFeatureComingSoon };
};