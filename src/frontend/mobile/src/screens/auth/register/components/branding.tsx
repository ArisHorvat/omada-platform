import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks';
import { WizardLayout } from '@/src/components/layout';
import { BrandingIdCardPreview } from '@/src/components/branding/BrandingIdCardPreview';
import { AppText, ClayView, Icon, SegmentedControl, ProgressiveImage } from '@/src/components/ui';
import { DEFAULT_BASE_COLORS, getContrastTextColor } from '@/src/utils/brandingPalettes';
import { useBrandingLogic } from '../hooks/useBrandingLogic';
import { useRegistrationContext } from '../context/RegistrationContext';

export default function BrandingScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { submitRegistration, isSubmitting } = useRegistrationContext();
  const {
    branding,
    orgData,
    logo,
    pickLogo,
    generatedPalettes,
    handlePaletteSelect,
    activeTab,
    setActiveTab,
    selectedBaseColor,
    setSelectedBaseColor,
    sortedExtractedColors,
  } = useBrandingLogic();

  const roleLabel = orgData.type === 'university' ? 'STUDENT' : 'EMPLOYEE';

  return (
    <WizardLayout
      step={2}
      totalSteps={3}
      title="Branding"
      subtitle="Customize your organization's look"
      onBack={() => router.back()}
      onNext={submitRegistration}
      nextLabel="Create organization"
      isNextLoading={isSubmitting}
      contentPaddingBottom={280}
    >
      <BrandingIdCardPreview
        orgName={orgData.name}
        shortName={orgData.shortName}
        primary={branding.primary}
        secondary={branding.secondary}
        tertiary={branding.tertiary}
        logoUri={logo?.uri}
        roleLabel={roleLabel}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 16 }}>
        <TouchableOpacity onPress={pickLogo}>
          <ClayView
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.card,
            }}
          >
            {logo ? (
              <ProgressiveImage source={{ uri: logo.uri }} style={{ width: 60, height: 60, borderRadius: 30 }} />
            ) : (
              <Icon name="cloud-upload" size={32} color={colors.primary} />
            )}
          </ClayView>
        </TouchableOpacity>
        <View>
          <AppText weight="bold">Organization Logo</AppText>
          <AppText variant="caption">Tap circle to upload</AppText>
        </View>
      </View>

      <SegmentedControl
        options={['Base Colors', 'Presets']}
        selectedIndex={activeTab === 'colors' ? 0 : 1}
        onChange={(i) => setActiveTab(i === 0 ? 'colors' : 'palettes')}
      />

      <View style={{ marginTop: 20 }}>
        {activeTab === 'colors' ? (
          <View>
            {sortedExtractedColors.length > 0 ? (
              <View style={{ marginBottom: 20 }}>
                <AppText variant="caption" style={{ marginBottom: 12, color: colors.subtle }}>
                  EXTRACTED FROM LOGO
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                  {sortedExtractedColors.map((color, idx) => (
                    <TouchableOpacity key={`ext-${idx}`} onPress={() => setSelectedBaseColor(color)}>
                      <ClayView
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.card,
                        }}
                      >
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: color,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {selectedBaseColor === color ? (
                            <Icon name="check" size={24} color={getContrastTextColor(color)} />
                          ) : null}
                        </View>
                      </ClayView>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            <AppText variant="caption" style={{ marginBottom: 12, color: colors.subtle }}>
              STANDARD COLORS
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {DEFAULT_BASE_COLORS.map((color, idx) => (
                <TouchableOpacity key={`def-${idx}`} onPress={() => setSelectedBaseColor(color)}>
                  <ClayView
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.card,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: color,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selectedBaseColor === color ? (
                        <Icon name="check" size={24} color={getContrastTextColor(color)} />
                      ) : null}
                    </View>
                  </ClayView>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }}>
            {generatedPalettes.map((p, idx) => {
              const isActive = branding.primary === p.primary && branding.secondary === p.secondary;
              return (
                <TouchableOpacity key={idx} style={{ width: '48%' }} onPress={() => handlePaletteSelect(p)}>
                  <ClayView
                    style={{
                      padding: 12,
                      borderRadius: 16,
                      backgroundColor: isActive ? colors.card : colors.background,
                      borderWidth: isActive ? 2 : 0,
                      borderColor: p.primary,
                    }}
                  >
                    <View style={{ flexDirection: 'row', height: 40, borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
                      <View style={{ flex: 1, backgroundColor: p.primary }} />
                      <View style={{ flex: 1, backgroundColor: p.secondary }} />
                      <View style={{ flex: 1, backgroundColor: p.tertiary }} />
                    </View>
                    <AppText weight="bold" style={{ textAlign: 'center', fontSize: 12 }}>
                      {p.name}
                    </AppText>
                  </ClayView>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </WizardLayout>
  );
}
