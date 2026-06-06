import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useMemo, useState } from 'react';

import { orgAdminApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { UpdateCurrentOrganizationRequest, OrganizationType } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { ToolsService } from '@/src/services/ToolsService';
import { bumpOnboardingStep } from '../../utils/onboarding';

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

export const useBrandingWorkspace = () => {
  const queryClient = useQueryClient();
  const { organization, refreshOrganization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const orgQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.current(orgId),
    queryFn: () => unwrap(orgAdminApi.getCurrent()),
    enabled: !!orgId,
  });

  const org = orgQuery.data ?? organization;

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [primary, setPrimary] = useState('#3b82f6');
  const [secondary, setSecondary] = useState('#64748b');
  const [tertiary, setTertiary] = useState('#eab308');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [organizationType, setOrganizationType] = useState<OrganizationType>(OrganizationType.Corporate);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!org) return;
    setName(org.name ?? '');
    setShortName(org.shortName ?? '');
    setEmailDomain(org.emailDomain ?? '');
    setPrimary(org.primaryColor ?? '#3b82f6');
    setSecondary(org.secondaryColor ?? '#64748b');
    setTertiary(org.tertiaryColor ?? '#eab308');
    setLogoUri(org.logoUrl ?? null);
    setOrganizationType(org.organizationType ?? OrganizationType.Corporate);
    setIsActive(org.isActive ?? true);
  }, [org?.id, org?.name, org?.primaryColor, org?.organizationType, org?.isActive]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let logoUrl = logoUri ?? org?.logoUrl ?? undefined;
      if (logoUri && logoUri.startsWith('file://')) {
        logoUrl = await ToolsService.uploadLogo(logoUri);
      }

      const payload = UpdateCurrentOrganizationRequest.fromJS({
        name: name.trim(),
        shortName: shortName.trim() || undefined,
        emailDomain: emailDomain.trim() || undefined,
        primaryColor: primary,
        secondaryColor: secondary,
        tertiaryColor: tertiary,
        logoUrl,
        onboardingStep: bumpOnboardingStep(org?.onboardingStep, 3),
        organizationType,
        isActive,
      });

      return unwrap(orgAdminApi.updateCurrent(payload));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.current(orgId) });
      await refreshOrganization();
      Alert.alert('Saved', 'Organization branding updated.');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const pickLogo = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]?.uri) {
      setLogoUri(result.assets[0].uri);
      try {
        const extracted = await ToolsService.extractColors(result.assets[0].uri);
        if (extracted?.[0]) setPrimary(extracted[0]);
      } catch {
        /* optional */
      }
    }
  };

  const palettePresets = useMemo(
    () => [
      { name: 'Ocean', primary: '#3b82f6', secondary: '#1e3a8a', tertiary: '#93c5fd' },
      { name: 'Forest', primary: '#10b981', secondary: '#065f46', tertiary: '#6ee7b7' },
      { name: 'Sunset', primary: '#f59e0b', secondary: '#b45309', tertiary: '#fde68a' },
      { name: 'Violet', primary: '#8b5cf6', secondary: '#5b21b6', tertiary: '#c4b5fd' },
    ],
    []
  );

  return {
    org,
    isLoading: orgQuery.isLoading,
    name,
    setName,
    shortName,
    setShortName,
    emailDomain,
    setEmailDomain,
    primary,
    setPrimary,
    secondary,
    setSecondary,
    tertiary,
    setTertiary,
    logoUri,
    pickLogo,
    palettePresets,
    defaultColors: DEFAULT_COLORS,
    organizationType,
    setOrganizationType,
    isActive,
    setIsActive,
    save: () => saveMutation.mutate(),
    isSaving: saveMutation.isPending,
  };
};
