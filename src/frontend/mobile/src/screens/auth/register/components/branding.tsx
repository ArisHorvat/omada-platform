import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { MaterialIcons } from '@expo/vector-icons';
import { WizardLayout } from '@/src/components/WizardLayout';
import QRCode from 'react-native-qrcode-svg';
import { createStyles } from '@/src/screens/auth/register/styles/branding.styles';
import { useBrandingLogic, getContrastColor, DEFAULT_BASE_COLORS } from '../hooks/useBrandingLogic';

export default function BrandingScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { branding, orgData, logo, pickLogo, sortedExtractedColors, selectedBaseColor, setSelectedBaseColor, isExtracting, activeTab, setActiveTab, generatedPalettes, handlePaletteSelect } = useBrandingLogic();

  const onPrimary = getContrastColor(branding.primary);
  const onSecondary = getContrastColor(branding.secondary);
  const onTertiary = getContrastColor(branding.tertiary);

  return (
    <WizardLayout step={3} totalSteps={6} title="Branding" onBack={() => router.back()} onNext={() => router.push('/register-flow/roles')}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Digital ID Preview */}
        <Text style={[styles.label, { textAlign: 'center', marginBottom: 16 }]}>Live Preview</Text>
        <View style={[styles.idCard, { backgroundColor: branding.primary }]}>
            <View style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: branding.secondary, opacity: 0.5 }} />
            <View style={{ position: 'absolute', bottom: -30, left: -10, width: 120, height: 120, borderRadius: 60, backgroundColor: branding.tertiary, opacity: 0.3 }} />
            <View style={styles.idHeader}>
                <Text style={[styles.idOrgName, { color: onPrimary }]}>{orgData.name || 'Organization'}</Text>
                {logo && <Image source={{ uri: logo.uri }} style={{ width: 32, height: 32, borderRadius: 16 }} />}
            </View>
            <View style={styles.idContent}>
                <View style={styles.idAvatar}>
                    <MaterialIcons name="person" size={40} color={onPrimary} />
                </View>
                <View>
                    <Text style={[styles.idName, { color: onPrimary }]}>Jane Student</Text>
                    <Text style={[styles.idRole, { color: onPrimary }]}>Student</Text>
                </View>
            </View>
            <View style={styles.idFooter}>
                <Text style={{ color: onPrimary, fontSize: 10, opacity: 0.7 }}>ID: 12345678</Text>
                <View style={styles.idQr}>
                    <QRCode value="preview" size={40} />
                </View>
            </View>
        </View>

        {/* Logo Upload */}
        <Text style={styles.label}>1. Organization Logo</Text>
        <View style={styles.logoCard}>
          {logo ? (
            <Image source={{ uri: logo.uri }} style={styles.logoPreview} resizeMode="contain" />
          ) : (
            <View style={styles.logoPlaceholder}>
              <MaterialIcons name="business" size={32} color={colors.subtle} />
            </View>
          )}
          <TouchableOpacity onPress={pickLogo} style={styles.uploadBtn}>
            {isExtracting ? (
                <ActivityIndicator size="small" color={colors.primary} />
            ) : (
                <Text style={styles.uploadText}>{logo ? 'Change Logo' : 'Upload Logo'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, activeTab === 'colors' && styles.tabActive]} onPress={() => setActiveTab('colors')}>
                <Text style={[styles.tabText, activeTab === 'colors' && styles.tabTextActive]}>Base Colors</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'palettes' && styles.tabActive]} onPress={() => setActiveTab('palettes')}>
                <Text style={[styles.tabText, activeTab === 'palettes' && styles.tabTextActive]}>Palettes</Text>
            </TouchableOpacity>
        </View>

        {activeTab === 'colors' ? (
            <View>
                <Text style={styles.label}>2. Choose Base Color</Text>
                {sortedExtractedColors.length > 0 && (
                <>
                    <Text style={styles.subLabel}>Extracted from Logo</Text>
                    <View style={styles.colorRow}>
                    {sortedExtractedColors.map((color, idx) => (
                        <TouchableOpacity 
                        key={`ext-${idx}`} 
                        style={[styles.colorCircle, { backgroundColor: color }, selectedBaseColor === color && styles.colorCircleActive]}
                        onPress={() => setSelectedBaseColor(color)}
                        />
                    ))}
                    </View>
                </>
                )}

                <Text style={styles.subLabel}>Standard Colors</Text>
                <View style={styles.colorRow}>
                {DEFAULT_BASE_COLORS.map((color, idx) => (
                    <TouchableOpacity 
                    key={`def-${idx}`} 
                    style={[styles.colorCircle, { backgroundColor: color }, selectedBaseColor === color && styles.colorCircleActive]}
                    onPress={() => setSelectedBaseColor(color)}
                    />
                ))}
                </View>
            </View>
        ) : (
            <View>
                <Text style={styles.label}>3. Select a Palette</Text>
                <View style={styles.paletteGrid}>
                {generatedPalettes.map((p, idx) => {
                    const isActive = branding.primary === p.primary && branding.secondary === p.secondary && branding.tertiary === p.tertiary;
                    return (
                    <TouchableOpacity 
                        key={idx} 
                        style={[styles.paletteCard, isActive && styles.paletteCardActive]}
                        onPress={() => handlePaletteSelect(p)}
                    >
                        <View style={styles.palettePreview}>
                        <View style={[styles.paletteStripe, { backgroundColor: p.primary }]} />
                        <View style={[styles.paletteStripe, { backgroundColor: p.secondary }]} />
                        <View style={[styles.paletteStripe, { backgroundColor: p.tertiary }]} />
                        </View>
                        <Text style={styles.paletteName}>{p.name}</Text>
                    </TouchableOpacity>
                    );
                })}
                </View>
            </View>
        )}

      </ScrollView>
    </WizardLayout>
  );
}
