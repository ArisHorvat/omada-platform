import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { OrganizationService } from '@/src/services/OrganizationService';
import { RegisterOrganizationRequest, UserImportDto } from '@/src/types/api';

interface RegistrationContextType {
  // --- State ---
  orgData: { name: string; shortName: string; type: string };
  setOrgData: (data: { name: string; shortName: string; type: string }) => void;

  branding: { primary: string; secondary: string; tertiary: string };
  setBranding: (data: { primary: string; secondary: string; tertiary: string }) => void;

  logo: any; // Contains { uri, name, type }
  setLogo: (file: any) => void;

  adminData: { firstName: string; lastName: string; email: string; password: string; repeatPassword: string; };
  setAdminData: (data: any) => void;

  roles: string[];
  setRoles: (roles: string[]) => void;

  allWidgets: Set<string>;
  roleWidgets: Record<string, Set<string>>;
  setRoleWidgets: (data: Record<string, Set<string>>) => void;
  toggleWidgetForRole: (role: string, widget: string) => void;
  
  importedUsers: UserImportDto[];
  setImportedUsers: (users: UserImportDto[]) => void;

  defaultUserPassword: string;
  setDefaultUserPassword: (pass: string) => void;

  // --- Actions ---
  submitRegistration: () => Promise<void>;
  isSubmitting: boolean;
}

const RegistrationContext = createContext<RegistrationContextType>({} as RegistrationContextType);

export const RegistrationProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Organization Details
  const [orgData, setOrgData] = useState({ name: '', shortName: '', type: 'corporate' });

  // 2. Branding
  const [branding, setBranding] = useState({ primary: '#3b82f6', secondary: '#64748b', tertiary: '#eab308' });
  const [logo, setLogo] = useState<any>(null);

  // 3. Admin Details
  const [adminData, setAdminData] = useState({ firstName: '', lastName: '', email: '', password: '', repeatPassword: '' });

  // 4. Roles & Widgets
  const [roles, setRoles] = useState<string[]>(['Admin', 'User']);
  const [roleWidgets, setRoleWidgets] = useState<Record<string, Set<string>>>({ 
    'Admin': new Set(['users', 'settings', 'schedule']),
    'User': new Set(['schedule'])
  });
  
  // Computed property for all selected widgets across all roles
  const allWidgets = new Set(Object.values(roleWidgets).flatMap(set => Array.from(set)));

  const toggleWidgetForRole = (role: string, widget: string) => {
    setRoleWidgets(prev => {
      const newSet = new Set(prev[role] || []);
      if (newSet.has(widget)) newSet.delete(widget);
      else newSet.add(widget);
      return { ...prev, [role]: newSet };
    });
  };

  // 5. Users
  const [importedUsers, setImportedUsers] = useState<UserImportDto[]>([]);
  const [defaultUserPassword, setDefaultUserPassword] = useState('Welcome123!');

  // --- SUBMISSION LOGIC ---
  const submitRegistration = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Step A: Upload Logo (if exists)
      let uploadedLogoUrl = null;
      if (logo && logo.uri) {
        try {
          uploadedLogoUrl = await OrganizationService.uploadLogo(logo.uri);
        } catch (uploadError) {
          console.warn("Logo upload failed, continuing without logo", uploadError);
        }
      }

      // Step B: Construct Payload
      const request: RegisterOrganizationRequest = {
        name: orgData.name,
        shortName: orgData.shortName,
        organizationType: orgData.type,
        emailDomain: 'general', // You might want to calculate this from Admin Email or Input
        
        // Admin
        adminFirstName: adminData.firstName,
        adminLastName: adminData.lastName,
        adminEmail: adminData.email,
        password: adminData.password,
        
        // Config
        defaultUserPassword: defaultUserPassword,
        logoUrl: uploadedLogoUrl || undefined,
        primaryColor: branding.primary,
        secondaryColor: branding.secondary,
        tertiaryColor: branding.tertiary,
        
        // Data Structures
        roles: roles,
        widgets: Array.from(allWidgets),
        
        // Map Record<string, Set> to DTO List
        roleWidgetMappings: Object.entries(roleWidgets).map(([roleName, widgetSet]) => ({
          roleName: roleName,
          widgets: Array.from(widgetSet)
        })),
        
        users: importedUsers
      };

      // Step C: Send to API
      await OrganizationService.create(request);

      // Step D: Success
      router.replace('/register-flow/registration-success');

    } catch (error: any) {
      // The apiClient automatically extracts the message from AppError
      Alert.alert("Registration Failed", error.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RegistrationContext.Provider value={{
      orgData, setOrgData,
      branding, setBranding,
      logo, setLogo,
      adminData, setAdminData,
      roles, setRoles,
      roleWidgets, setRoleWidgets, toggleWidgetForRole, allWidgets,
      importedUsers, setImportedUsers,
      defaultUserPassword, setDefaultUserPassword,
      submitRegistration, isSubmitting
    }}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistrationContext = () => useContext(RegistrationContext);