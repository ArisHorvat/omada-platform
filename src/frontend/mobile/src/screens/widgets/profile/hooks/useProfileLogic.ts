import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { CurrentOrganizationService } from '@/src/services/CurrentOrganizationService';
import { UserService } from '@/src/services/UserService';
import { AuthService } from '@/src/services/AuthService';

export const useProfileLogic = () => {
  const { setToken, email, role, token, setIsSwitching } = useAuth();
  const [organization, setOrganization] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [myOrganizations, setMyOrganizations] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (token) {
          const userData = await UserService.getMe();
          setUser(userData);
        }
      } catch (e) { console.error(e); }
    };
    loadData();
    const unsubscribe = CurrentOrganizationService.subscribe((data) => {
      if (data) { setOrganization(data); setIsLoading(false); }
    });
    return () => unsubscribe();
  }, [token]);

  const fetchMyOrganizations = async () => {
    if (!token) return;
    try {
      const data = await AuthService.getMyOrganizations();
      setMyOrganizations(data);
      setShowAccountSwitcher(true);
    } 
    catch (e) { 
      // Silent fail or user feedback
      console.error(e);
      Alert.alert("Error", "Could not load your organizations."); 
    }
  };

  const handleSwitchOrg = async (orgId: string) => {
    try {
      setIsSwitching(true);
      const data = await AuthService.switchOrg(orgId);
      
      // Add a small delay to ensure the animation is seen and transition is smooth
      setTimeout(async () => {
        // 1. Clear the old organization data so the repository fetches the new one
        CurrentOrganizationService.clear();
        
        // 2. Set the new token and wait for it to be persisted
        await setToken(data.token);
        
        // 3. Force fetch the new organization details immediately
        await CurrentOrganizationService.fetch();

        setShowAccountSwitcher(false);
        // Turn off switching state after navigation settles
        setTimeout(() => setIsSwitching(false), 1000);
      }, 500);
    } catch (e) { setIsSwitching(false); Alert.alert("Error", "Failed to switch organization."); }
  };

  const handleLogout = () => Alert.alert("Logout", "Are you sure?", [{ text: "Cancel", style: "cancel" }, { text: "Logout", style: "destructive", onPress: () => { CurrentOrganizationService.clear(); setToken(null); }}]);

  return { user, organization, isLoading, showAccountSwitcher, setShowAccountSwitcher, myOrganizations, fetchMyOrganizations, handleSwitchOrg, handleLogout, email, role };
};