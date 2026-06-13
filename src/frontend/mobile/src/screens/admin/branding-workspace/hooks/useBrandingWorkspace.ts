import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { orgAdminApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { OrganizationType, UpdateCurrentOrganizationRequest, type OrganizationDetailsDto } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { ToolsService } from '@/src/services/ToolsService';
import {
  BrandingPalette,
  DEFAULT_BASE_COLORS,
  generatePalettes,
  normalizeHexColor,
  sortExtractedColors,
} from '@/src/utils/brandingPalettes';
import { resolveMediaUrl } from '@/src/utils/resolveMediaUrl';
import { confirmAction } from '@/src/utils/confirmAction';
import { markOnboardingStepComplete } from '../../utils/onboarding';

type BrandingBaseline = {
  name: string;
  shortName: string;
  primary: string;
  secondary: string;
  tertiary: string;
  logoUri: string | null;
  serverLogoUrl: string | null;
  organizationType: OrganizationType;
  isActive: boolean;
  selectedBaseColor: string;
};

function baselineFromOrg(org: OrganizationDetailsDto): BrandingBaseline {
  const serverLogoUrl = org.logoUrl ?? null;
  return {
    name: org.name ?? '',
    shortName: org.shortName ?? '',
    primary: org.primaryColor ?? '#3b82f6',
    secondary: org.secondaryColor ?? '#64748b',
    tertiary: org.tertiaryColor ?? '#eab308',
    logoUri: serverLogoUrl ? resolveMediaUrl(serverLogoUrl) : null,
    serverLogoUrl,
    organizationType: org.organizationType ?? OrganizationType.Corporate,
    isActive: org.isActive ?? true,
    selectedBaseColor: org.primaryColor ?? DEFAULT_BASE_COLORS[0],
  };
}

function baselinesEqual(a: BrandingBaseline, b: BrandingBaseline): boolean {
  return (
    a.name === b.name &&
    a.shortName === b.shortName &&
    a.primary === b.primary &&
    a.secondary === b.secondary &&
    a.tertiary === b.tertiary &&
    a.logoUri === b.logoUri &&
    a.organizationType === b.organizationType &&
    a.isActive === b.isActive &&
    a.selectedBaseColor === b.selectedBaseColor
  );
}

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
  const baselineRef = useRef<BrandingBaseline | null>(null);
  const hydratedOrgIdRef = useRef<string | null>(null);

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [primary, setPrimary] = useState('#3b82f6');
  const [secondary, setSecondary] = useState('#64748b');
  const [tertiary, setTertiary] = useState('#eab308');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [pendingLogoUpload, setPendingLogoUpload] = useState<{
    mimeType?: string;
    fileName?: string;
  } | null>(null);
  const [serverLogoUrl, setServerLogoUrl] = useState<string | null>(null);
  const [organizationType, setOrganizationType] = useState<OrganizationType>(OrganizationType.Corporate);
  const [isActive, setIsActive] = useState(true);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [selectedBaseColor, setSelectedBaseColor] = useState<string>(DEFAULT_BASE_COLORS[0]);
  const [activeTab, setActiveTab] = useState<'colors' | 'palettes'>('colors');
  const [isExtracting, setIsExtracting] = useState(false);

  const applyBaseline = useCallback((baseline: BrandingBaseline) => {
    setName(baseline.name);
    setShortName(baseline.shortName);
    setPrimary(baseline.primary);
    setSecondary(baseline.secondary);
    setTertiary(baseline.tertiary);
    setLogoUri(baseline.logoUri);
    setPendingLogoUpload(null);
    setServerLogoUrl(baseline.serverLogoUrl);
    setOrganizationType(baseline.organizationType);
    setIsActive(baseline.isActive);
    setSelectedBaseColor(baseline.selectedBaseColor);
    setExtractedColors([]);
  }, []);

  useEffect(() => {
    if (orgId && hydratedOrgIdRef.current && hydratedOrgIdRef.current !== orgId) {
      hydratedOrgIdRef.current = null;
      baselineRef.current = null;
    }
  }, [orgId]);

  useEffect(() => {
    const source = orgQuery.data ?? (organization?.id ? organization : null);
    if (!source?.id) return;
    if (hydratedOrgIdRef.current === source.id && baselineRef.current) return;

    const baseline = baselineFromOrg(source as OrganizationDetailsDto);
    baselineRef.current = baseline;
    applyBaseline(baseline);
    hydratedOrgIdRef.current = source.id;
  }, [orgQuery.data, organization, applyBaseline]);

  const hasChanges = useMemo(() => {
    const saved = baselineRef.current;
    if (!saved) return false;
    return !baselinesEqual(saved, {
      name,
      shortName,
      primary,
      secondary,
      tertiary,
      logoUri,
      serverLogoUrl,
      organizationType,
      isActive,
      selectedBaseColor,
    });
  }, [
    name,
    shortName,
    primary,
    secondary,
    tertiary,
    logoUri,
    serverLogoUrl,
    organizationType,
    isActive,
    selectedBaseColor,
  ]);

  const sortedExtractedColors = useMemo(
    () => sortExtractedColors(extractedColors),
    [extractedColors],
  );
  const generatedPalettes = useMemo(() => generatePalettes(selectedBaseColor), [selectedBaseColor]);

  const applyPalette = (palette: BrandingPalette) => {
    setPrimary(palette.primary);
    setSecondary(palette.secondary);
    setTertiary(palette.tertiary);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let logoUrl = serverLogoUrl ?? undefined;
      if (pendingLogoUpload && logoUri) {
        logoUrl = await ToolsService.uploadLogo(logoUri, pendingLogoUpload);
      } else if (!logoUri) {
        logoUrl = undefined;
      }

      const payload = UpdateCurrentOrganizationRequest.fromJS({
        name: name.trim(),
        shortName: shortName.trim() || undefined,
        primaryColor: primary,
        secondaryColor: secondary,
        tertiaryColor: tertiary,
        logoUrl,
        completedOnboardingSteps: markOnboardingStepComplete(
          org?.completedOnboardingSteps,
          'branding',
        ),
        organizationType,
        isActive,
      });

      return unwrap(orgAdminApi.updateCurrent(payload));
    },
    onSuccess: async (updated) => {
      const next = baselineFromOrg(updated);
      baselineRef.current = next;
      applyBaseline(next);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.current(orgId) });
      await refreshOrganization();
      Alert.alert('Saved', 'Organization branding updated.');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const pickLogo = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]?.uri) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const mimeType = asset.mimeType ?? undefined;
    const fileName = asset.name ?? undefined;

    setLogoUri(uri);
    setPendingLogoUpload({
      mimeType: asset.mimeType ?? undefined,
      fileName: asset.name ?? undefined,
    });
    setIsExtracting(true);

    try {
      const colors = await ToolsService.extractColors(uri, { mimeType, fileName });
      if (colors?.length) {
        const sorted = sortExtractedColors(colors);
        const dominant = normalizeHexColor(colors[0]) ?? sorted[0];
        setExtractedColors(sorted);
        setSelectedBaseColor(dominant);
        applyPalette(generatePalettes(dominant)[0]);
        Alert.alert(
          'Colors Extracted',
          "We've found some colors from your logo. Palettes have been generated based on them.",
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not extract colors automatically.';
      Alert.alert('Notice', `${message} Please choose a base color manually.`);
    } finally {
      setIsExtracting(false);
    }
  };

  const discardChanges = useCallback(() => {
    const saved = baselineRef.current;
    if (!saved || !hasChanges) return;

    confirmAction({
      title: 'Discard changes?',
      message: 'Unsaved edits to name, logo, colors, and organization settings will be lost.',
      confirmText: 'Discard',
      destructive: true,
      onConfirm: () => applyBaseline(saved),
    });
  }, [applyBaseline, hasChanges]);

  return {
    org,
    isLoading: orgQuery.isLoading,
    name,
    setName,
    shortName,
    setShortName,
    primary,
    secondary,
    tertiary,
    logoUri,
    pickLogo,
    isExtracting,
    organizationType,
    setOrganizationType,
    isActive,
    setIsActive,
    sortedExtractedColors,
    selectedBaseColor,
    setSelectedBaseColor,
    activeTab,
    setActiveTab,
    generatedPalettes,
    handlePaletteSelect: applyPalette,
    defaultColors: DEFAULT_BASE_COLORS,
    hasChanges,
    discardChanges,
    save: () => saveMutation.mutate(),
    isSaving: saveMutation.isPending,
  };
};
