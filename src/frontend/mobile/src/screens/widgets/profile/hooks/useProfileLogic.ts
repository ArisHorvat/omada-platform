import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { UserService } from '@/src/services/UserService';
import { AuthService } from '@/src/services/AuthService';
import { OrganizationService } from '@/src/services/OrganizationService';
import { User, OrganizationDetailsDto, UserOrganizationDto } from '@/src/types/api';

export const useProfileLogic = () => {
  const { 
    activeSession, 
    switchSession, 
    addSession, 
    availableSessions, 
    logout 
  } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<OrganizationDetailsDto | null>(null);
  const [myOrganizations, setMyOrganizations] = useState<UserOrganizationDto[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  // 1. Load Profile Data
  useEffect(() => {
    const loadData = async () => {
      if (!activeSession?.orgId) return;
      setIsLoading(true);
      try {
        const [userData, orgData] = await Promise.all([
            UserService.getMe(),
            OrganizationService.getById(activeSession.orgId)
        ]);
        setUser(userData);
        setOrganization(orgData);
      } catch (e) { 
        console.error("Profile load error", e); 
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [activeSession?.orgId]);

  // 2. Open Switcher & Normalize Data
  const openOrgSwitcher = async () => {
    try {
      const data: any[] = await AuthService.getMyOrganizations();
      
      const normalizedData: UserOrganizationDto[] = data.map(item => ({
        organizationId: item.organizationId || item.OrganizationId || item.id,
        organizationName: item.organizationName || item.OrganizationName || item.name,
        role: item.role || item.Role,
        isCurrent: item.isCurrent || item.IsCurrent
      }));

      setMyOrganizations(normalizedData);
      setShowAccountSwitcher(true);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not load your organizations.");
    }
  };

  // 3. THE FIX: Handle Switch Logic safely
  const handleSwitchOrg = async (targetOrgId: string) => {
    if (!targetOrgId) return;
    
    setIsSwitching(true);
    setShowAccountSwitcher(false); 

    try {
      // SAFE CHECK: Ensure s.orgId exists before calling toLowerCase()
      // This prevents the crash if old/corrupt data is in storage
      const existingSession = availableSessions.find(
        s => s.orgId && s.orgId.toLowerCase() === targetOrgId.toLowerCase()
      );

      if (existingSession) {
        // SCENARIO A: We have a token. Just switch context.
        console.log(`[Profile] Switching to existing session: ${existingSession.orgId}`);
        await switchSession(existingSession.orgId);
      } else {
        // SCENARIO B: We don't have a token yet. Fetch one from API.
        console.log(`[Profile] Fetching new token for org: ${targetOrgId}`);
        
        const response = await AuthService.switchOrganization(targetOrgId);
        await addSession(response.token);
      }
      
    } catch (e: any) { 
        console.error("Switch failed", e);
        Alert.alert("Error", e.message || "Failed to switch organization."); 
    } finally {
        setIsSwitching(false);
    }
  };

  const handleLogout = () => {
      Alert.alert("Logout", "Are you sure?", [
          { text: "Cancel", style: "cancel" }, 
          { text: "Logout", style: "destructive", onPress: logout }
      ]);
  };

  return { 
    user, 
    organization, 
    isLoading, 
    isSwitching,
    showAccountSwitcher, 
    setShowAccountSwitcher,
    myOrganizations,
    openOrgSwitcher, 
    handleSwitchOrg,
    handleLogout,
    role: activeSession?.role,
    email: activeSession?.email
  };
};