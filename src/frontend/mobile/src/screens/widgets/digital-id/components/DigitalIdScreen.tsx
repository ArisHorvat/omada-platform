import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppButton, AppText, BottomSheet, WidgetErrorState } from '@/src/components/ui';
import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { WidgetPageShell } from '@/src/components/layout';
import { useBreakpoint, useContentWidth, useScreenshotWarning, useThemeColors } from '@/src/hooks';
import { usePermission } from '@/src/context/PermissionContext';
import { useDigitalIdLogic } from '../hooks/useDigitalIdLogic';
import { useBrightnessWhileFocused } from '../hooks/useBrightnessWhileFocused';
import { Code128BarcodeSvg } from './Code128BarcodeSvg';
import { DigitalIdBarcodeDetails, DigitalIdPassCard } from './DigitalIdPassCard';
import { DigitalIdHowToUseCard } from './DigitalIdHowToUseCard';
import { ADMIN_ACCOUNT_HOME } from '@/src/screens/admin/utils/adminAccountRoutes';

export default function DigitalIdScreen({ adminConsole = false }: { adminConsole?: boolean }) {
  const colors = useThemeColors();
  const router = useRouter();
  const contentWidth = useContentWidth();
  const { isWideShell } = useBreakpoint();
  const { can } = usePermission();
  const { digitalId, isLoading, isError, digitalIdQuery } = useDigitalIdLogic();
  useBrightnessWhileFocused();
  useScreenshotWarning();
  const [barcodeOpen, setBarcodeOpen] = useState(false);

  const canScan = can('attendance.take') || can('digital-id.manage');

  const headerBack = useMemo(
    () =>
      adminConsole
        ? { showBack: true as const, onBack: () => router.replace(ADMIN_ACCOUNT_HOME as never) }
        : {},
    [adminConsole, router],
  );

  const scannerRoute = adminConsole ? '/admin-digital-id-scanner' : '/digital-id-scanner';
  const cardWidth = Math.min(contentWidth - 32, 420);
  const qrSize = Math.min(cardWidth - 96, isWideShell ? 240 : 210);

  if (isLoading) {
    return (
      <WidgetPageShell fullBleed={adminConsole}>
        <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
          <ScreenHeader title="Digital ID" {...headerBack} />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </WidgetPageShell>
    );
  }

  if (isError || !digitalId) {
    return (
      <WidgetPageShell fullBleed={adminConsole}>
        <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
          <ScreenHeader title="Digital ID" {...headerBack} />
          <View style={[styles.centered, { paddingHorizontal: 24 }]}>
            <WidgetErrorState
              message="Could not load your Digital ID. You may not have access or the network failed."
              onRetry={() => void digitalIdQuery.refetch()}
            />
          </View>
        </SafeAreaView>
      </WidgetPageShell>
    );
  }

  const scanHelp = (
    <DigitalIdHowToUseCard
      organizationName={digitalId.organizationName}
      canScan={canScan}
      onOpenScanner={() => router.push(scannerRoute as never)}
      inline={isWideShell}
    />
  );

  return (
    <WidgetPageShell fullBleed={adminConsole}>
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <ScreenHeader title="Digital ID" {...headerBack} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.contentRow, isWideShell && styles.contentRowWide]}>
            <View style={[styles.passColumn, { width: isWideShell ? cardWidth : '100%' }]}>
              <DigitalIdPassCard digitalId={digitalId} qrSize={qrSize} />
              <AppButton
                title="Show member barcode"
                variant="secondary"
                icon="confirmation-number"
                onPress={() => setBarcodeOpen(true)}
                style={{ marginTop: 16 }}
              />
            </View>
            {isWideShell ? <View style={styles.sideColumn}>{scanHelp}</View> : null}
          </View>

          {!isWideShell ? scanHelp : null}

          <AppText variant="caption" style={[styles.disclaimer, { color: colors.subtle }]}>
            Brightness is raised on mobile while this screen is open to help scanners read the code.
          </AppText>
        </ScrollView>

        <BottomSheet isVisible={barcodeOpen} onClose={() => setBarcodeOpen(false)}>
          <AppText variant="h3" weight="bold" style={{ color: colors.text, marginBottom: 12 }}>
            Member barcode
          </AppText>
          <DigitalIdBarcodeDetails digitalId={digitalId} />
          <View style={[styles.barcodeIsland, { borderColor: colors.border, marginTop: 16 }]}>
            <Code128BarcodeSvg value={digitalId.barcodeValue} height={52} barWidth={1.2} />
          </View>
        </BottomSheet>
      </SafeAreaView>
    </WidgetPageShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentRow: {
    alignItems: 'center',
  },
  contentRowWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 24,
  },
  passColumn: {
    alignItems: 'center',
  },
  sideColumn: {
    flex: 1,
    maxWidth: 360,
    minWidth: 280,
    paddingTop: 0,
  },
  disclaimer: {
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    maxWidth: 420,
    alignSelf: 'center',
  },
  barcodeIsland: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
