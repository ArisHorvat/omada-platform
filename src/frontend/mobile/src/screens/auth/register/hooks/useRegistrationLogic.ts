import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useRegistration } from '@/src/screens/auth/register/context/RegistrationContext'; // Keeping context for state persistence across steps
import { OrganizationService } from '@/src/services/OrganizationService';
import { Alert } from 'react-native';

export const useRegistrationLogic = () => {
  const router = useRouter();
  const { 
    orgData, setOrgData, 
    adminData, setAdminData, 
    branding, setBranding, 
    logo, setLogo, 
    roles, setRoles, 
    roleWidgets, setRoleWidgets,
    importedUsers, setImportedUsers,
    defaultUserPassword, setDefaultUserPassword
  } = useRegistration();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRegistration = async () => {
    setIsSubmitting(true);
    try {
      let logoUrl = null;
      if (logo) {
        logoUrl = await OrganizationService.uploadLogo(logo.uri);
      }

      const allWidgets = new Set<string>();
      Object.values(roleWidgets).forEach(set => set.forEach(w => allWidgets.add(w)));

      const payload = {
        name: orgData.name,
        shortName: orgData.shortName,
        organizationType: orgData.type,
        emailDomain: 'general', 
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

  return {
    // State
    orgData, setOrgData,
    adminData, setAdminData,
    branding, setBranding,
    logo, setLogo,
    roles, setRoles,
    roleWidgets, setRoleWidgets,
    importedUsers, setImportedUsers,
    defaultUserPassword, setDefaultUserPassword,
    isSubmitting,
    // Actions
    submitRegistration
  };
};
