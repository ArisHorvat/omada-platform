import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { AppText, ClayView, Icon, ProgressiveImage, SegmentedControl, WidgetErrorState } from '@/src/components/ui';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { useThemeColors } from '@/src/hooks';
import { useDigitalIdLogic } from '../hooks/useDigitalIdLogic';
import { useBrightnessWhileFocused } from '../hooks/useBrightnessWhileFocused';
import { Code128BarcodeSvg } from './Code128BarcodeSvg';

const { width: screenWidth } = Dimensions.get('window');

export default function DigitalIdScreen() {
  const colors = useThemeColors();
  const { digitalId, isLoading, isError, digitalIdQuery } = useDigitalIdLogic();
  useBrightnessWhileFocused();
  const [codeTab, setCodeTab] = useState(0); // 0 = QR, 1 = Barcode

  const cardWidth = Math.min(screenWidth - 32, 400);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <ClayBackButton style={{ backgroundColor: colors.card, borderRadius: 22 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !digitalId) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <ClayBackButton style={{ backgroundColor: colors.card, borderRadius: 22 }} />
        </View>
        <View style={[styles.centered, { paddingHorizontal: 24 }]}>
          <WidgetErrorState
            message="Could not load your Digital ID. You may not have access or the network failed."
            onRetry={() => void digitalIdQuery.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const accent = colors.primary;
  const expiresLabel = format(new Date(digitalId.qrExpiresAtUtc), "MMM d, yyyy '·' h:mm a");
  const scanPanelSurface = colors.isDark ? colors.card : 'rgba(255,255,255,0.96)';
  const codeIslandBorder = colors.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)';
  const kickerColor = colors.isDark ? colors.subtle : '#64748b';
  const qrSize = Math.min(cardWidth - 80, 220);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <ClayBackButton style={{ backgroundColor: colors.card, borderRadius: 22 }} />
        <AppText variant="h3" weight="bold" style={{ color: colors.text }}>
          Digital ID
        </AppText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ClayView depth={18} puffy={0} color={colors.card} style={[styles.badgeShell, { width: cardWidth }]}>
          <LinearGradient
            colors={[`${accent}22`, `${accent}08`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientPad}
          >
            <View style={styles.orgRow}>
              <AppText variant="caption" weight="bold" style={[styles.orgKicker, { color: accent }]}>
                {digitalId.organizationName.toUpperCase()}
              </AppText>
              <Icon name="verified" size={18} color={accent} />
            </View>

            <View style={styles.identityRow}>
              <ClayView depth={10} puffy={4} color={colors.card} style={styles.avatarRing}>
                {digitalId.avatarUrl ? (
                  <ProgressiveImage source={{ uri: digitalId.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: `${accent}18` }]}>
                    <Icon name="person" size={40} color={accent} />
                  </View>
                )}
              </ClayView>
              <View style={styles.identityText}>
                <AppText variant="h2" weight="bold" numberOfLines={2} style={{ color: colors.text }}>
                  {digitalId.fullName}
                </AppText>
                <AppText variant="body" numberOfLines={2} style={{ color: colors.subtle, marginTop: 4 }}>
                  {digitalId.roleName}
                </AppText>
              </View>
            </View>
          </LinearGradient>

          <ClayView
            depth={6}
            puffy={16}
            color={scanPanelSurface}
            style={[
              styles.scanPanel,
              colors.isDark && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: colors.border,
              },
            ]}
          >
            <View style={styles.segmentWrap}>
              <SegmentedControl
                options={['QR Code', 'Barcode']}
                selectedIndex={codeTab}
                onChange={setCodeTab}
              />
            </View>

            <View style={styles.codeSwitchArea}>
              {codeTab === 0 ? (
                <Animated.View
                  key="qr"
                  entering={FadeIn.duration(220)}
                  exiting={FadeOut.duration(160)}
                  style={styles.codeTabInner}
                >
                  <AppText variant="caption" weight="bold" style={[styles.scanKicker, { color: kickerColor }]}>
                    SCAN AT ENTRY
                  </AppText>
                  <View
                    style={[
                      styles.codeIsland,
                      {
                        borderColor: codeIslandBorder,
                        shadowOpacity: colors.isDark ? 0 : 0.08,
                        elevation: colors.isDark ? 0 : 3,
                      },
                    ]}
                  >
                    <QRCode value={digitalId.qrToken} size={qrSize} color="#0f172a" backgroundColor="#ffffff" />
                  </View>
                  <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center', marginTop: 10 }}>
                    QR refreshes · {expiresLabel}
                  </AppText>
                </Animated.View>
              ) : (
                <Animated.View
                  key="barcode"
                  entering={FadeIn.duration(220)}
                  exiting={FadeOut.duration(160)}
                  style={styles.codeTabInner}
                >
                  <AppText variant="caption" weight="bold" style={[styles.scanKicker, { color: kickerColor }]}>
                    MEMBER BARCODE
                  </AppText>
                  <View
                    style={[
                      styles.barcodeIsland,
                      {
                        borderColor: codeIslandBorder,
                        shadowOpacity: colors.isDark ? 0 : 0.08,
                        elevation: colors.isDark ? 0 : 3,
                      },
                    ]}
                  >
                    <Code128BarcodeSvg value={digitalId.barcodeValue} height={52} barWidth={1.2} />
                    <AppText
                      variant="caption"
                      style={{
                        marginTop: 8,
                        letterSpacing: 1.1,
                        color: '#0f172a',
                        fontFamily: 'monospace',
                        fontSize: 13,
                      }}
                    >
                      {digitalId.barcodeValue}
                    </AppText>
                  </View>
                </Animated.View>
              )}
            </View>
          </ClayView>
        </ClayView>

        <AppText variant="caption" style={[styles.disclaimer, { color: colors.subtle }]}>
          Present this pass for verification. Brightness is raised while this screen is open to help scanners read the
          code.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  badgeShell: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  gradientPad: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orgKicker: {
    letterSpacing: 1.2,
    flex: 1,
    paddingRight: 8,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarRing: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  scanPanel: {
    marginTop: 4,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'stretch',
  },
  segmentWrap: {
    width: '100%',
    marginBottom: 4,
  },
  codeSwitchArea: {
    minHeight: 320,
    width: '100%',
  },
  codeTabInner: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
  },
  scanKicker: {
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  codeIsland: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
    shadowColor: '#000',
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  barcodeIsland: {
    width: '100%',
    maxWidth: '100%',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
    shadowColor: '#000',
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  disclaimer: {
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
