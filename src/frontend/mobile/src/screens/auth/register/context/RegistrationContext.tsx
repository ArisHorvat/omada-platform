import React, { createContext, useContext, useState } from 'react';
import { OrganizationService } from '@/src/services/OrganizationService';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

interface RegistrationContextType {
  orgData: { name: string; shortName: string; type: string };
  setOrgData: React.Dispatch<React.SetStateAction<{ name: string; shortName: string; type: string }>>;
  adminData: { firstName: string; lastName: string; email: string; password: string; repeatPassword: string };
  setAdminData: React.Dispatch<React.SetStateAction<{ firstName: string; lastName: string; email: string; password: string; repeatPassword: string }>>;
  branding: { primary: string; secondary: string; tertiary: string };
  setBranding: React.Dispatch<React.SetStateAction<{ primary: string; secondary: string; tertiary: string }>>;
  logo: DocumentPicker.DocumentPickerAsset | null;
  setLogo: React.Dispatch<React.SetStateAction<DocumentPicker.DocumentPickerAsset | null>>;
  roles: string[];
  setRoles: React.Dispatch<React.SetStateAction<string[]>>;
  defaultUserPassword: string;
  setDefaultUserPassword: React.Dispatch<React.SetStateAction<string>>;
  importedUsers: any[];
  setImportedUsers: React.Dispatch<React.SetStateAction<any[]>>;
  roleWidgets: Record<string, Set<string>>;
  setRoleWidgets: React.Dispatch<React.SetStateAction<Record<string, Set<string>>>>;
  submitRegistration: () => Promise<void>;
  isSubmitting: boolean;
}

const RegistrationContext = createContext<RegistrationContextType>({} as RegistrationContextType);

export const useRegistration = () => useContext(RegistrationContext);

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [orgData, setOrgData] = useState({ name: '', shortName: '', type: 'corporate' });
  const [adminData, setAdminData] = useState({ firstName: '', lastName: '', email: '', password: '', repeatPassword: '' });
  const [branding, setBranding] = useState({ primary: '#3b82f6', secondary: '#64748b', tertiary: '#eab308' });
  const [logo, setLogo] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [roles, setRoles] = useState<string[]>(['Employee', 'Team Lead', 'Project Manager', 'Director', 'HR Manager', 'Operations', 'Admin']);
  const [defaultUserPassword, setDefaultUserPassword] = useState('Welcome123!');
  const [importedUsers, setImportedUsers] = useState<any[]>([]);
  const [roleWidgets, setRoleWidgets] = useState<Record<string, Set<string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRegistration = async () => {
    setIsSubmitting(true);
    try {
      let logoUrl = null;
      if (logo) {
        logoUrl = await OrganizationService.uploadLogo({
            uri: logo.uri,
            name: logo.name || 'logo.jpg',
            type: logo.mimeType || 'image/jpeg'
        });
      }

      const allWidgets = new Set<string>();
      Object.values(roleWidgets).forEach(set => set.forEach(w => allWidgets.add(w)));

      const payload = {
        name: orgData.name,
        shortName: orgData.shortName,
        organizationType: orgData.type,
        emailDomain: 'general', // Placeholder
        adminFirstName: adminData.firstName,
        adminLastName: adminData.lastName,
        adminEmail: adminData.email,
        password: adminData.password,
        logoUrl: logoUrl,
        defaultUserPassword: defaultUserPassword,
        primaryColor: branding.primary,
        secondaryColor: branding.secondary,
        tertiaryColor: branding.tertiary,
        roles: roles,
        widgets: Array.from(allWidgets),
        roleWidgetMappings: Object.entries(roleWidgets).map(([role, widgets]) => ({
          roleName: role,
          widgets: Array.from(widgets)
        })),
        users: importedUsers
      };

      await OrganizationService.create(payload);
      router.replace('/register-flow/registration-success');
    } catch (e: any) {
      Alert.alert("Registration Failed", e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RegistrationContext.Provider value={{
      orgData, setOrgData,
      adminData, setAdminData,
      branding, setBranding,
      logo, setLogo,
      roles, setRoles,
      defaultUserPassword, setDefaultUserPassword,
      importedUsers, setImportedUsers,
      roleWidgets, setRoleWidgets,
      submitRegistration, isSubmitting
    }}>
      {children}
    </RegistrationContext.Provider>
  );
};
