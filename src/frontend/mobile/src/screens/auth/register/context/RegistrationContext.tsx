import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { ORG_PRESETS } from '@/src/constants/widgets'; 
import { PermissionLevel } from '@/src/constants/permissions';
import * as Haptics from 'expo-haptics';
import { RegisterOrganizationRequest, RoleWidgetMappingDto, UserImportDto } from '@/src/api/generatedClient';
import { ToolsService } from '@/src/services/ToolsService';
import { orgApi, unwrap } from '@/src/api';

type RoleWidgetMap = Record<string, Record<string, PermissionLevel>>;

interface RegistrationContextType {
  orgData: { name: string; shortName: string; type: string };
  setOrgData: (data: { name: string; shortName: string; type: string }) => void;
  setOrganizationType: (type: 'university' | 'corporate') => void;

  branding: { primary: string; secondary: string; tertiary: string };
  setBranding: (data: { primary: string; secondary: string; tertiary: string }) => void;

  logo: any; 
  setLogo: (file: any) => void;

  adminData: { firstName: string; lastName: string; email: string; password: string; repeatPassword: string; };
  setAdminData: (data: any) => void;

  roles: string[];
  setRoles: (roles: string[]) => void;

  roleWidgetAccess: RoleWidgetMap;
  setRoleWidgetAccess: (data: RoleWidgetMap) => void;
  toggleWidgetForRole: (role: string, widget: string) => void;
  
  importedUsers: UserImportDto[];
  setImportedUsers: (users: UserImportDto[]) => void;

  defaultUserPassword: string;
  setDefaultUserPassword: (pass: string) => void;

  submitRegistration: () => Promise<void>;
  isSubmitting: boolean;
}

const RegistrationContext = createContext<RegistrationContextType>({} as RegistrationContextType);

export const RegistrationProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orgData, setOrgData] = useState({ name: '', shortName: '', type: 'corporate' });
  const [branding, setBranding] = useState({ primary: '#3b82f6', secondary: '#64748b', tertiary: '#eab308' });
  const [logo, setLogo] = useState<any>(null);
  const [adminData, setAdminData] = useState({ firstName: '', lastName: '', email: '', password: '', repeatPassword: '' });
  
  const [roles, setRoles] = useState<string[]>(['Admin']);
  const [roleWidgetAccess, setRoleWidgetAccess] = useState<RoleWidgetMap>({});
  
  const [importedUsers, setImportedUsers] = useState<UserImportDto[]>([]);
  const [defaultUserPassword, setDefaultUserPassword] = useState('Welcome123!');

  const setOrganizationType = (type: 'university' | 'corporate') => {
    setOrgData(prev => ({ ...prev, type }));
    const preset = ORG_PRESETS[type];
    if (!preset) return;

    const newRoles = ['Admin', ...preset.roles.map(r => r.name)];
    setRoles(newRoles);

    const newAccess: RoleWidgetMap = {};
    newAccess['Admin'] = {
        'schedule': 'admin', 'news': 'admin', 'users': 'admin', 'settings': 'admin', 'chat': 'admin'
    };
    preset.roles.forEach(roleDef => {
        newAccess[roleDef.name] = roleDef.widgets;
    });

    setRoleWidgetAccess(newAccess);
  };

  useEffect(() => {
    setOrganizationType('corporate');
  }, []);

  const toggleWidgetForRole = (role: string, widget: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRoleWidgetAccess(prev => {
      const roleAccess = { ...(prev[role] || {}) };
      const currentLevel = roleAccess[widget];

      if (!currentLevel) roleAccess[widget] = 'view';
      else if (currentLevel === 'view') roleAccess[widget] = 'edit';
      else if (currentLevel === 'edit') roleAccess[widget] = 'admin';
      else delete roleAccess[widget];

      return { ...prev, [role]: roleAccess };
    });
  };

  const submitRegistration = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let uploadedLogoUrl = null;
      if (logo && logo.uri) {
        try {
          uploadedLogoUrl = await ToolsService.uploadLogo(logo.uri);
        } catch (e) { console.warn("Logo upload failed"); }
      }

      const extractedDomain = adminData.email.includes('@') 
        ? `@${adminData.email.split('@')[1]}` 
        : '@general.com';

      const request = new RegisterOrganizationRequest({
        name: orgData.name,
        shortName: orgData.shortName,
        organizationType: orgData.type,
        emailDomain: extractedDomain,
        adminFirstName: adminData.firstName,
        adminLastName: adminData.lastName,
        adminEmail: adminData.email,
        password: adminData.password,
        defaultUserPassword: defaultUserPassword,
        logoUrl: uploadedLogoUrl || undefined,
        primaryColor: branding.primary,
        secondaryColor: branding.secondary,
        tertiaryColor: branding.tertiary,
        roles: roles,
        widgets: Array.from(new Set(Object.values(roleWidgetAccess).flatMap(w => Object.keys(w)))),
        roleWidgetMappings: Object.entries(roleWidgetAccess).flatMap(([roleName, widgets]) => 
            Object.entries(widgets).map(([widgetId, level]) => new RoleWidgetMappingDto({ 
                roleName: roleName, 
                widgetKey: widgetId, 
                accessLevel: level 
            }))
        ),
        users: importedUsers.map(user => new UserImportDto({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
        }))
      });

      await unwrap(orgApi.create(request));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/register-flow/registration-success');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Registration Failed", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RegistrationContext.Provider value={{
      orgData, setOrgData, setOrganizationType,
      branding, setBranding,
      logo, setLogo,
      adminData, setAdminData,
      roles, setRoles,
      roleWidgetAccess, setRoleWidgetAccess, toggleWidgetForRole,
      importedUsers, setImportedUsers,
      defaultUserPassword, setDefaultUserPassword,
      submitRegistration, isSubmitting
    }}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistrationContext = () => useContext(RegistrationContext);