import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks';
import { WizardLayout } from '@/src/components/layout';
import { AppText, GlassView, Icon, SegmentedControl, ProgressiveImage } from '@/src/components/ui';
import { useBrandingLogic } from '../hooks/useBrandingLogic';
import QRCode from 'react-native-qrcode-svg';

// Helper to determine text color on badges
const getContrastTextColor = (hex: string) => {
    if (!hex) return '#000';
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? '#000000' : '#FFFFFF';
};

export default function BrandingScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { 
    branding, 
    orgData, // Need this for the org name in preview
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

  // Helper for segmented control index
  const tabIndex = activeTab === 'colors' ? 0 : 1;
  const handleTabChange = (idx: number) => setActiveTab(idx === 0 ? 'colors' : 'palettes');

  // Determine text color for the preview card
  const onPrimary = getContrastTextColor(branding.primary);

  // Default colors if extraction fails or is empty
  const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  return (
    <WizardLayout 
        step={2} 
        totalSteps={6} 
        title="Branding" 
        subtitle="Customize your organization's look"
        onBack={() => router.back()} 
        onNext={() => router.push('/register-flow/roles')}
    >
        {/* 1. DIGITAL ID PREVIEW (Exact Match) */}
        <View style={{ marginBottom: 32, alignItems: 'center' }}>
            <AppText variant="caption" style={{ marginBottom: 12, color: colors.subtle, letterSpacing: 1 }}>DIGITAL ID PREVIEW</AppText>
            
            <View style={{
                width: '100%',
                aspectRatio: 1.58, // Standard ID Card Ratio
                borderRadius: 20,
                backgroundColor: branding.primary,
                padding: 24,
                justifyContent: 'space-between',
                overflow: 'hidden',
                // Shadows
                shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 8
            }}>
                 {/* Decorative Circles */}
                 <View style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: branding.secondary, opacity: 0.5 }} />
                 <View style={{ position: 'absolute', bottom: -30, left: -10, width: 120, height: 120, borderRadius: 60, backgroundColor: branding.tertiary, opacity: 0.3 }} />

                 {/* Header: Org Name & Logo */}
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                     <AppText weight="bold" style={{ fontSize: 18, color: onPrimary, opacity: 0.9, flex: 1 }}>
                        {orgData.name || "Organization Name"}
                     </AppText>
                     {logo ? (
                         <ProgressiveImage source={{ uri: logo.uri }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                     ) : (
                         <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="business" size={16} color={onPrimary} />
                         </View>
                     )}
                 </View>

                 {/* Content: Avatar, Name, Role */}
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                     <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <Icon name="person" size={40} color={onPrimary} />
                     </View>
                     <View>
                         <AppText weight="bold" style={{ fontSize: 22, color: onPrimary }}>Jane Doe</AppText>
                         <AppText weight="bold" style={{ fontSize: 14, color: onPrimary, opacity: 0.8, marginTop: 4, textTransform: 'uppercase' }}>STUDENT</AppText>
                     </View>
                 </View>

                 {/* Footer: ID & QR */}
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                     <AppText style={{ color: onPrimary, fontSize: 10, opacity: 0.7 }}>ID: 12345678</AppText>
                     <View style={{ width: 48, height: 48, backgroundColor: '#fff', borderRadius: 8, padding: 4, alignItems: 'center', justifyContent: 'center' }}>
                         <QRCode value="preview" size={40} />
                     </View>
                 </View>
            </View>
        </View>


        {/* 2. Logo Upload Section */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 16 }}>
            <TouchableOpacity onPress={pickLogo} activeOpacity={0.7}>
                <GlassView 
                    intensity={20} 
                    style={{ 
                        width: 80, height: 80, borderRadius: 40, 
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1, borderColor: colors.border,
                        borderStyle: 'dashed',
                        backgroundColor: colors.card,
                        overflow: 'hidden'
                    }}
                >
                    {logo ? (
                        <ProgressiveImage 
                          source={{ uri: logo.uri }} 
                          style={{ width: '100%', height: '100%' }} 
                          resizeMode="cover"
                        />
                    ) : (
                        <Icon name="cloud-upload" size={32} color={colors.primary} />
                    )}
                </GlassView>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
                <AppText weight="bold">Organization Logo</AppText>
                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                    Tap the circle to upload. We will extract colors automatically.
                </AppText>
            </View>
        </View>

        {/* 3. Theme Selection Tabs */}
        <View style={{ marginBottom: 24 }}>
             <SegmentedControl 
                options={['Base Colors', 'Theme Presets']}
                selectedIndex={tabIndex}
                onChange={handleTabChange}
             />
        </View>

        {activeTab === 'colors' ? (
            <View>
                {/* EXTRACTED COLORS */}
                {sortedExtractedColors.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                        <AppText variant="caption" style={{ marginBottom: 12, color: colors.subtle }}>EXTRACTED FROM LOGO</AppText>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                            {sortedExtractedColors.map((color, idx) => (
                                <TouchableOpacity 
                                    key={`ext-${idx}`} 
                                    onPress={() => setSelectedBaseColor(color)}
                                    activeOpacity={0.8}
                                    style={{
                                        width: 48, height: 48, borderRadius: 24, backgroundColor: color,
                                        borderWidth: selectedBaseColor === color ? 3 : 1,
                                        borderColor: selectedBaseColor === color ? colors.text : 'rgba(0,0,0,0.1)',
                                        shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4
                                    }}
                                >
                                    {selectedBaseColor === color && (
                                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon name="check" size={24} color={getContrastTextColor(color)} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* STANDARD COLORS */}
                <View>
                    <AppText variant="caption" style={{ marginBottom: 12, color: colors.subtle }}>STANDARD COLORS</AppText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                        {DEFAULT_COLORS.map((color, idx) => (
                            <TouchableOpacity 
                                key={`def-${idx}`} 
                                onPress={() => setSelectedBaseColor(color)}
                                activeOpacity={0.8}
                                style={{
                                    width: 48, height: 48, borderRadius: 24, backgroundColor: color,
                                    borderWidth: selectedBaseColor === color ? 3 : 1,
                                    borderColor: selectedBaseColor === color ? colors.text : 'rgba(0,0,0,0.1)',
                                    shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4
                                }}
                            >
                                {selectedBaseColor === color && (
                                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon name="check" size={24} color={getContrastTextColor(color)} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        ) : (
            <View>
                <AppText variant="caption" style={{ marginBottom: 12, color: colors.subtle }}>GENERATED PALETTES</AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }}>
                    {generatedPalettes.map((p, idx) => {
                        const isActive = branding.primary === p.primary && branding.secondary === p.secondary;
                        
                        return (
                            <TouchableOpacity 
                                key={idx} 
                                style={{ width: '48%' }}
                                activeOpacity={0.7}
                                onPress={() => handlePaletteSelect(p)}
                            >
                                <GlassView 
                                    intensity={isActive ? 30 : 10}
                                    style={{ 
                                        padding: 12, borderRadius: 16,
                                        borderWidth: 2, 
                                        borderColor: isActive ? p.primary : 'transparent',
                                        backgroundColor: isActive ? colors.card : undefined,
                                        transform: isActive ? [{scale: 1.02}] : []
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', height: 40, borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
                                        <View style={{ flex: 1, backgroundColor: p.primary }} />
                                        <View style={{ flex: 1, backgroundColor: p.secondary }} />
                                        <View style={{ flex: 1, backgroundColor: p.tertiary }} />
                                    </View>
                                    
                                    {/* FIXED: Text height and Size */}
                                    <View style={{ height: 24, justifyContent: 'center' }}>
                                        <AppText 
                                            weight="bold" 
                                            style={{ fontSize: 14, textAlign: 'center' }} // Larger font
                                            numberOfLines={1} 
                                            adjustsFontSizeToFit
                                        >
                                            {p.name}
                                        </AppText>
                                    </View>
                                </GlassView>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        )}

    </WizardLayout>
  );
}