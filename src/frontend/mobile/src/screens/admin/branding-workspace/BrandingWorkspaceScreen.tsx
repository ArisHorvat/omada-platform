import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { AppButton, AppText, ClayView, Icon, ProgressiveImage, SegmentedControl } from '@/src/components/ui';
import { OrganizationType } from '@/src/api/generatedClient';
import { useThemeColors } from '@/src/hooks';
import { useBrandingWorkspace } from './hooks/useBrandingWorkspace';

export default function BrandingWorkspaceScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const {
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
    defaultColors,
    organizationType,
    setOrganizationType,
    isActive,
    setIsActive,
    save,
    isSaving,
  } = useBrandingWorkspace();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageContainer>
          <ScreenHeader title="Branding & appearance" />

          <ScrollView contentContainerStyle={styles.scroll}>
          <ClayView depth={8} puffy={16} color={primary} style={styles.preview}>
            <AppText weight="bold" style={{ color: '#fff', fontSize: 18 }}>
              {name || 'Organization name'}
            </AppText>
            <View style={styles.previewBars}>
              <View style={[styles.bar, { backgroundColor: secondary }]} />
              <View style={[styles.bar, { backgroundColor: tertiary }]} />
            </View>
          </ClayView>

          <Field label="Organization name" value={name} onChangeText={setName} colors={colors} />
          <Field label="Short name" value={shortName} onChangeText={setShortName} colors={colors} />
          <Field label="Email domain" value={emailDomain} onChangeText={setEmailDomain} colors={colors} placeholder="company.com" />

          <TouchableOpacity onPress={pickLogo} style={{ marginVertical: 16 }}>
            <ClayView depth={6} puffy={14} color={colors.card} style={styles.logoRow}>
              <ClayView depth={3} color={colors.background} style={styles.logoCircle}>
                {logoUri ? (
                  <ProgressiveImage source={{ uri: logoUri }} style={{ width: 64, height: 64 }} resizeMode="cover" />
                ) : (
                  <Icon name="cloud-upload" size={28} color={colors.primary} />
                )}
              </ClayView>
              <View>
                <AppText weight="bold">Organization logo</AppText>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  Tap to upload — colors can be extracted automatically
                </AppText>
              </View>
            </ClayView>
          </TouchableOpacity>

          <AppText variant="caption" style={styles.sectionLabel}>
            PRIMARY COLOR
          </AppText>
          <View style={styles.colorRow}>
            {defaultColors.map((c) => (
              <TouchableOpacity key={c} onPress={() => setPrimary(c)}>
                <View style={[styles.swatch, { backgroundColor: c, borderWidth: primary === c ? 3 : 0, borderColor: colors.text }]} />
              </TouchableOpacity>
            ))}
          </View>

          <AppText variant="caption" style={styles.sectionLabel}>
            PALETTE PRESETS
          </AppText>
          <View style={styles.presetGrid}>
            {palettePresets.map((p) => (
              <TouchableOpacity
                key={p.name}
                style={{ width: '47%' }}
                onPress={() => {
                  setPrimary(p.primary);
                  setSecondary(p.secondary);
                  setTertiary(p.tertiary);
                }}
              >
                <ClayView depth={4} puffy={10} color={colors.card} style={styles.presetCard}>
                  <View style={styles.presetStrip}>
                    <View style={{ flex: 1, backgroundColor: p.primary }} />
                    <View style={{ flex: 1, backgroundColor: p.secondary }} />
                    <View style={{ flex: 1, backgroundColor: p.tertiary }} />
                  </View>
                  <AppText variant="caption" weight="bold">
                    {p.name}
                  </AppText>
                </ClayView>
              </TouchableOpacity>
            ))}
          </View>

          <ClayView depth={3} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <AppText variant="label" style={{ color: colors.subtle, marginBottom: 10 }}>
              ORGANIZATION SETTINGS
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
              Organization type
            </AppText>
            <SegmentedControl
              options={['Corporate', 'University']}
              selectedIndex={organizationType === OrganizationType.University ? 1 : 0}
              onChange={(index) =>
                setOrganizationType(index === 1 ? OrganizationType.University : OrganizationType.Corporate)
              }
            />
            <View style={{ marginTop: 14 }}>
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
                Organization status
              </AppText>
              <SegmentedControl
                options={['Active', 'Inactive']}
                selectedIndex={isActive ? 0 : 1}
                onChange={(index) => setIsActive(index === 0)}
              />
            </View>
          </ClayView>

          <AppButton title={isSaving ? 'Saving…' : 'Save branding'} onPress={save} disabled={isSaving} />
          </ScrollView>
        </PageContainer>
      </SafeAreaView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  colors,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  colors: ReturnType<typeof useThemeColors>;
  placeholder?: string;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
        {label}
      </AppText>
      <ClayView depth={2} color={colors.card} style={{ borderRadius: 12, paddingHorizontal: 12 }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.subtle}
          style={{ paddingVertical: 12, color: colors.text, fontSize: 16 }}
        />
      </ClayView>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 16, paddingBottom: 120 },
    preview: { borderRadius: 20, marginBottom: 20, minHeight: 120, justifyContent: 'space-between' },
    previewBars: { flexDirection: 'row', gap: 8, marginTop: 16 },
    bar: { flex: 1, height: 8, borderRadius: 4 },
    logoRow: { borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
    logoCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    sectionLabel: { color: colors.subtle, marginBottom: 8, marginTop: 4 },
    colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    swatch: { width: 40, height: 40, borderRadius: 20 },
    presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    presetCard: { borderRadius: 14, padding: 10 },
    presetStrip: { flexDirection: 'row', height: 24, borderRadius: 6, overflow: 'hidden', marginBottom: 6 },
  });
