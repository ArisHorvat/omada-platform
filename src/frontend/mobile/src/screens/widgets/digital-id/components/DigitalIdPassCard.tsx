import React from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppText, Icon, ProgressiveImage } from '@/src/components/ui';
import { getContrastTextColor } from '@/src/utils/brandingPalettes';
import { formatMemberId, memberIdSuffix } from '../utils/formatMemberId';
import { useQrCountdown } from '../hooks/useQrCountdown';
import type { DigitalIdDto } from '@/src/api/generatedClient';

const CARD_MAX_WIDTH = 420;

type Props = {
  digitalId: DigitalIdDto;
  qrSize?: number;
  showCountdown?: boolean;
};

export function DigitalIdPassCard({ digitalId, qrSize = 200, showCountdown = true }: Props) {
  const primary = digitalId.primaryColor ?? '#3b82f6';
  const secondary = digitalId.secondaryColor ?? '#64748b';
  const tertiary = digitalId.tertiaryColor ?? '#eab308';
  const onPrimary = getContrastTextColor(primary);
  const secondsLeft = useQrCountdown(showCountdown ? digitalId.qrExpiresAtUtc : undefined);
  const shortLabel = digitalId.organizationShortName?.trim() || digitalId.organizationName;
  const memberSuffix = memberIdSuffix(digitalId.barcodeValue);

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: primary }]}>
        <View style={[styles.blob, styles.blobTop, { backgroundColor: secondary }]} />
        <View style={[styles.blob, styles.blobBottom, { backgroundColor: tertiary }]} />

        <View style={styles.headerRow}>
          <View style={styles.orgMeta}>
            <AppText weight="bold" numberOfLines={2} style={[styles.orgName, { color: onPrimary }]}>
              {digitalId.organizationName}
            </AppText>
            <AppText style={[styles.orgShort, { color: onPrimary }]} numberOfLines={1}>
              {shortLabel.toUpperCase()}
            </AppText>
          </View>
          {digitalId.organizationLogoUrl ? (
            <ProgressiveImage
              source={{ uri: digitalId.organizationLogoUrl }}
              style={styles.logo}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: `${onPrimary}22` }]}>
              <Icon name="verified" size={16} color={onPrimary} />
            </View>
          )}
        </View>

        <View style={styles.memberRow}>
          <View style={[styles.avatarRing, { backgroundColor: `${onPrimary}22` }]}>
            {digitalId.avatarUrl ? (
              <ProgressiveImage source={{ uri: digitalId.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <Icon name="person" size={22} color={onPrimary} />
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText weight="bold" numberOfLines={2} style={[styles.personName, { color: onPrimary }]}>
              {digitalId.fullName}
            </AppText>
            <AppText style={[styles.roleLabel, { color: onPrimary }]} numberOfLines={1}>
              {digitalId.roleName}
              {memberSuffix ? ` · #${memberSuffix}` : ''}
            </AppText>
          </View>
        </View>

        <View style={styles.qrSection}>
          <AppText style={[styles.scanLabel, { color: onPrimary }]}>SHOW AT ENTRY</AppText>
          <View style={styles.qrIsland}>
            <QRCode value={digitalId.qrToken} size={qrSize} color="#0f172a" backgroundColor="#ffffff" />
          </View>
          {showCountdown ? (
            <AppText style={[styles.countdown, { color: onPrimary }]}>
              {secondsLeft > 0 ? `Refreshes in 0:${String(secondsLeft).padStart(2, '0')}` : 'Refreshing code…'}
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function DigitalIdBarcodeDetails({ digitalId }: { digitalId: DigitalIdDto }) {
  return (
    <View style={styles.barcodeMeta}>
      <AppText variant="caption" style={styles.barcodeHint}>
        Stable member number for card readers that do not scan QR.
      </AppText>
      <AppText variant="body" weight="bold" style={styles.barcodeDigits}>
        {formatMemberId(digitalId.barcodeValue)}
      </AppText>
    </View>
  );
}

export const DIGITAL_ID_CARD_MAX_WIDTH = CARD_MAX_WIDTH;

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTop: {
    top: -28,
    right: -28,
    width: 110,
    height: 110,
    opacity: 0.45,
  },
  blobBottom: {
    bottom: -36,
    left: -20,
    width: 120,
    height: 120,
    opacity: 0.35,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    zIndex: 1,
    marginBottom: 14,
  },
  orgMeta: {
    flex: 1,
    minWidth: 0,
  },
  orgName: {
    fontSize: 16,
    lineHeight: 21,
  },
  orgShort: {
    fontSize: 10,
    opacity: 0.85,
    marginTop: 3,
    letterSpacing: 1,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  logoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
    marginBottom: 16,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  personName: {
    fontSize: 20,
    lineHeight: 24,
  },
  roleLabel: {
    fontSize: 12,
    opacity: 0.88,
    marginTop: 2,
  },
  qrSection: {
    alignItems: 'center',
    zIndex: 1,
  },
  scanLabel: {
    fontSize: 10,
    letterSpacing: 1.1,
    fontWeight: '700',
    marginBottom: 10,
    opacity: 0.9,
  },
  qrIsland: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  countdown: {
    marginTop: 10,
    fontSize: 12,
    opacity: 0.9,
  },
  barcodeMeta: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  barcodeHint: {
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.85,
  },
  barcodeDigits: {
    letterSpacing: 1.2,
    fontFamily: 'monospace',
  },
});
