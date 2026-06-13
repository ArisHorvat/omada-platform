import React from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { BrandingIdCardPreview } from '@/src/components/branding/BrandingIdCardPreview';
import {
  AppButton,
  AppText,
  ClayView,
  Icon,
  IconInput,
  ProgressiveImage,
  SegmentedControl,
} from '@/src/components/ui';
import { OrganizationType } from '@/src/api/generatedClient';
import { useThemeColors } from '@/src/hooks';
import { DEFAULT_BASE_COLORS, getContrastTextColor } from '@/src/utils/brandingPalettes';
import { useBrandingWorkspace } from './hooks/useBrandingWorkspace';
import { createStyles } from './styles/branding-workspace.styles';

export default function BrandingWorkspaceScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const {
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
    sortedExtractedColors,
    selectedBaseColor,
    setSelectedBaseColor,
    activeTab,
    setActiveTab,
    generatedPalettes,
    handlePaletteSelect,
    organizationType,
    setOrganizationType,
    isActive,
    setIsActive,
    save,
    isSaving,
    isLoading,
    hasChanges,
    discardChanges,
  } = useBrandingWorkspace();

  const roleLabel = organizationType === OrganizationType.University ? 'STUDENT' : 'EMPLOYEE';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageContainer fullBleed>
          <ScreenHeader title="Branding & appearance" />

          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              <BrandingIdCardPreview
                orgName={name}
                shortName={shortName}
                primary={primary}
                secondary={secondary}
                tertiary={tertiary}
                logoUri={logoUri}
                roleLabel={roleLabel}
              />

              <ClayView depth={6} color={colors.card} style={styles.sectionCard}>
                <AppText variant="caption" style={styles.sectionLabel}>
                  ORGANIZATION IDENTITY
                </AppText>
                <View style={{ gap: 12 }}>
                  <IconInput icon="business" placeholder="Organization name" value={name} onChangeText={setName} />
                  <IconInput
                    icon="short-text"
                    placeholder="Short name (e.g. UBB)"
                    value={shortName}
                    onChangeText={setShortName}
                    maxLength={10}
                    autoCapitalize="characters"
                  />
                </View>
              </ClayView>

              <View style={styles.logoRow}>
                <TouchableOpacity onPress={pickLogo} disabled={isExtracting} activeOpacity={0.8}>
                  <ClayView depth={4} color={colors.card} style={styles.logoCircle}>
                    <View style={styles.logoCenter}>
                      <View style={styles.logoInner}>
                        {logoUri ? (
                          <ProgressiveImage
                            source={{ uri: logoUri }}
                            style={styles.logoImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Icon name="cloud-upload" size={28} color={colors.primary} />
                        )}
                      </View>
                    </View>
                  </ClayView>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold">Organization logo</AppText>
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    {isExtracting ? 'Extracting colors…' : 'Tap circle to upload'}
                  </AppText>
                </View>
              </View>

              <SegmentedControl
                options={['Base Colors', 'Presets']}
                selectedIndex={activeTab === 'colors' ? 0 : 1}
                onChange={(index) => setActiveTab(index === 0 ? 'colors' : 'palettes')}
              />

              <View style={{ marginTop: 20 }}>
                {activeTab === 'colors' ? (
                  <View>
                    {sortedExtractedColors.length > 0 ? (
                      <View style={{ marginBottom: 20 }}>
                        <AppText variant="caption" style={styles.sectionLabel}>
                          EXTRACTED FROM LOGO
                        </AppText>
                        <View style={styles.colorGrid}>
                          {sortedExtractedColors.map((color, idx) => (
                            <TouchableOpacity
                              key={`ext-${idx}`}
                              onPress={() => setSelectedBaseColor(color)}
                              style={styles.colorSwatchHit}
                              activeOpacity={0.8}
                            >
                              <ClayView depth={2} color={colors.card} style={styles.colorSwatchOuter}>
                                <View style={styles.colorSwatchCenter}>
                                  <View style={[styles.colorSwatchInner, { backgroundColor: color }]}>
                                    {selectedBaseColor === color ? (
                                      <Icon name="check" size={22} color={getContrastTextColor(color)} />
                                    ) : null}
                                  </View>
                                </View>
                              </ClayView>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ) : null}

                    <AppText variant="caption" style={styles.sectionLabel}>
                      STANDARD COLORS
                    </AppText>
                    <View style={styles.colorGrid}>
                      {DEFAULT_BASE_COLORS.map((color, idx) => (
                        <TouchableOpacity
                          key={`def-${idx}`}
                          onPress={() => setSelectedBaseColor(color)}
                          style={styles.colorSwatchHit}
                          activeOpacity={0.8}
                        >
                          <ClayView depth={2} color={colors.card} style={styles.colorSwatchOuter}>
                            <View style={styles.colorSwatchCenter}>
                              <View style={[styles.colorSwatchInner, { backgroundColor: color }]}>
                                {selectedBaseColor === color ? (
                                  <Icon name="check" size={22} color={getContrastTextColor(color)} />
                                ) : null}
                              </View>
                            </View>
                          </ClayView>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.presetGrid}>
                    {generatedPalettes.map((palette, idx) => {
                      const isSelected =
                        primary === palette.primary && secondary === palette.secondary;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={styles.presetItem}
                          onPress={() => handlePaletteSelect(palette)}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.presetOuter,
                              isSelected && { borderColor: palette.primary, backgroundColor: colors.primaryContainer },
                            ]}
                          >
                            <ClayView
                              depth={4}
                              color={isSelected ? colors.primaryContainer : colors.card}
                              style={styles.presetCard}
                            >
                            <View style={styles.presetStrip}>
                              <View style={{ flex: 1, backgroundColor: palette.primary }} />
                              <View style={{ flex: 1, backgroundColor: palette.secondary }} />
                              <View style={{ flex: 1, backgroundColor: palette.tertiary }} />
                            </View>
                            <AppText weight="bold" style={{ textAlign: 'center', fontSize: 12 }}>
                              {palette.name}
                            </AppText>
                          </ClayView>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              <ClayView depth={6} color={colors.card} style={[styles.sectionCard, { marginTop: 24 }]}>
                <AppText variant="caption" style={styles.sectionLabel}>
                  ORGANIZATION SETTINGS
                </AppText>

                <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
                  Organization type
                </AppText>
                <View style={styles.typeRow}>
                  <OrganizationTypeOption
                    label="Corporate"
                    icon="business"
                    selected={organizationType === OrganizationType.Corporate}
                    onPress={() => setOrganizationType(OrganizationType.Corporate)}
                    colors={colors}
                    optionStyle={styles.typeOption}
                    outerStyle={styles.typeOuter}
                  />
                  <OrganizationTypeOption
                    label="University"
                    icon="school"
                    selected={organizationType === OrganizationType.University}
                    onPress={() => setOrganizationType(OrganizationType.University)}
                    colors={colors}
                    optionStyle={styles.typeOption}
                    outerStyle={styles.typeOuter}
                  />
                </View>

                <View style={{ marginTop: 16 }}>
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

              <View style={styles.actionRow}>
                <AppButton
                  title="Discard changes"
                  variant="outline"
                  onPress={discardChanges}
                  disabled={!hasChanges || isSaving}
                  style={styles.actionButton}
                />
                <AppButton
                  title={isSaving ? 'Saving…' : 'Save branding'}
                  onPress={save}
                  disabled={isSaving || !hasChanges}
                  style={styles.actionButton}
                />
              </View>
            </ScrollView>
          )}
        </PageContainer>
      </SafeAreaView>
    </View>
  );
}

function OrganizationTypeOption({
  label,
  icon,
  selected,
  onPress,
  colors,
  optionStyle,
  outerStyle,
}: {
  label: string;
  icon: 'business' | 'school';
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  optionStyle: ViewStyle;
  outerStyle: ViewStyle;
}) {
  return (
    <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.75}>
      <View
        style={[
          outerStyle,
          selected && { borderColor: colors.primary, backgroundColor: colors.primaryContainer },
        ]}
      >
        <ClayView
          depth={selected ? 8 : 4}
          color={selected ? colors.primaryContainer : colors.card}
          style={optionStyle}
        >
          <Icon name={icon} size={26} color={selected ? colors.primary : colors.subtle} />
          <AppText
            variant="label"
            weight={selected ? 'bold' : 'medium'}
            style={{ color: selected ? colors.primary : colors.text }}
          >
            {label}
          </AppText>
        </ClayView>
      </View>
    </TouchableOpacity>
  );
}
