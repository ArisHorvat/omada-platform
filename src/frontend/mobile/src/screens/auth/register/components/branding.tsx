import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks';
import { WizardLayout } from '@/src/components/layout';
import { AppText, ClayView, Icon, SegmentedControl, ProgressiveImage } from '@/src/components/ui';
import { useBrandingLogic } from '../hooks/useBrandingLogic';
import QRCode from 'react-native-qrcode-svg';

const getContrastTextColor = (hex: string) => {
    if (!hex) return '#000';
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    return (((r * 299) + (g * 587) + (b * 114)) / 1000) >= 128 ? '#000000' : '#FFFFFF';
};

export default function BrandingScreen() {
  const router = useRouter();
  const colors = useThemeColors();
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
    sortedExtractedColors 
  } = useBrandingLogic();

  const onPrimary = getContrastTextColor(branding.primary);
  const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  return (
    <WizardLayout 
        step={2} totalSteps={6} title="Branding" subtitle="Customize your organization's look"
        onBack={() => router.back()} onNext={() => router.push('/register-flow/roles')}
    >
        {/* 1. ID CARD PREVIEW */}
        <View style={{ marginBottom: 32, alignItems: 'center' }}>
            <View style={{
                width: '100%', aspectRatio: 1.58, borderRadius: 20,
                backgroundColor: branding.primary, padding: 24, justifyContent: 'space-between',
                shadowColor: branding.primary, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: {width:0, height: 8}, elevation: 10,
                overflow: 'hidden', position: 'relative'
            }}>
                 {/* Decorative Blobs - Restored to fix "Single Color" look */}
                 <View style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: branding.secondary, opacity: 0.5 }} />
                 <View style={{ position: 'absolute', bottom: -40, left: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: branding.tertiary, opacity: 0.4 }} />

                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 }}>
                     <AppText weight="bold" style={{ fontSize: 18, color: onPrimary }}>{orgData.name || "Org Name"}</AppText>
                     {logo ? <ProgressiveImage source={{ uri: logo.uri }} style={{ width: 32, height: 32, borderRadius: 16 }} /> : null}
                 </View>
                 
                 <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 1 }}>
                     <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 16, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="person" size={24} color={onPrimary} />
                     </View>
                     <View>
                         <AppText weight="bold" style={{ fontSize: 20, color: onPrimary }}>Jane Doe</AppText>
                         <AppText style={{ fontSize: 12, color: onPrimary, opacity: 0.8 }}>STUDENT</AppText>
                     </View>
                 </View>

                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
                     <AppText style={{ fontSize: 10, color: onPrimary, opacity: 0.8 }}>ID: 882910</AppText>
                     <View style={{ padding: 4, backgroundColor: '#FFF', borderRadius: 4 }}>
                        <QRCode value="preview" size={32} />
                     </View>
                 </View>
            </View>
        </View>

        {/* 2. LOGO UPLOAD */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 16 }}>
            <TouchableOpacity onPress={pickLogo}>
                <ClayView style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card }}>
                    {logo ? <ProgressiveImage source={{ uri: logo.uri }} style={{ width: 60, height: 60, borderRadius: 30 }} /> : <Icon name="cloud-upload" size={32} color={colors.primary} />}
                </ClayView>
            </TouchableOpacity>
            <View><AppText weight="bold">Organization Logo</AppText><AppText variant="caption">Tap circle to upload</AppText></View>
        </View>

        <SegmentedControl options={['Base Colors', 'Presets']} selectedIndex={activeTab === 'colors' ? 0 : 1} onChange={(i) => setActiveTab(i===0?'colors':'palettes')} />
        
        <View style={{ marginTop: 20 }}>
        {activeTab === 'colors' ? (
            <View>
                {/* 3. EXTRACTED COLORS - Nested View Strategy */}
                {sortedExtractedColors.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                        <AppText variant="caption" style={{ marginBottom: 12, color: colors.subtle }}>EXTRACTED FROM LOGO</AppText>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                            {sortedExtractedColors.map((color, idx) => (
                                <TouchableOpacity key={`ext-${idx}`} onPress={() => setSelectedBaseColor(color)}>
                                    {/* Outer Clay Container */}
                                    <ClayView style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card }}>
                                        {/* Inner Color Circle */}
                                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
                                            {selectedBaseColor === color && <Icon name="check" size={24} color={getContrastTextColor(color)} />}
                                        </View>
                                    </ClayView>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* 4. STANDARD COLORS - Nested View Strategy */}
                <View>
                    <AppText variant="caption" style={{ marginBottom: 12, color: colors.subtle }}>STANDARD COLORS</AppText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                        {DEFAULT_COLORS.map((color, idx) => (
                            <TouchableOpacity key={`def-${idx}`} onPress={() => setSelectedBaseColor(color)}>
                                <ClayView style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card }}>
                                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
                                        {selectedBaseColor === color && <Icon name="check" size={24} color={getContrastTextColor(color)} />}
                                    </View>
                                </ClayView>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }}>
                {generatedPalettes.map((p, idx) => {
                    // 5. SELECTION FIX: Check both Primary AND Secondary to avoid multi-select
                    const isActive = branding.primary === p.primary && branding.secondary === p.secondary;
                    
                    return (
                        <TouchableOpacity key={idx} style={{ width: '48%' }} onPress={() => handlePaletteSelect(p)}>
                            <ClayView style={{ 
                                padding: 12, borderRadius: 16, 
                                backgroundColor: isActive ? colors.card : colors.background, 
                                borderWidth: isActive ? 2 : 0, borderColor: p.primary 
                            }}>
                                <View style={{ flexDirection: 'row', height: 40, borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
                                    <View style={{ flex: 1, backgroundColor: p.primary }} /><View style={{ flex: 1, backgroundColor: p.secondary }} /><View style={{ flex: 1, backgroundColor: p.tertiary }} />
                                </View>
                                <AppText weight="bold" style={{ textAlign: 'center', fontSize: 12 }}>{p.name}</AppText>
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