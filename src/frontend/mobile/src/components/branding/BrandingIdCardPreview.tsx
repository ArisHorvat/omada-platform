import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppText, Icon, ProgressiveImage } from '@/src/components/ui';
import { getContrastTextColor } from '@/src/utils/brandingPalettes';

/** Credit-card-ish preview — capped so wide web layouts don't stretch it to half the page. */
const CARD_MAX_WIDTH = 300;

type Props = {
  orgName: string;
  shortName?: string;
  primary: string;
  secondary: string;
  tertiary: string;
  logoUri?: string | null;
  roleLabel?: string;
  personName?: string;
};

export function BrandingIdCardPreview({
  orgName,
  shortName,
  primary,
  secondary,
  tertiary,
  logoUri,
  roleLabel = 'STUDENT',
  personName = 'Jane Doe',
}: Props) {
  const onPrimary = getContrastTextColor(primary);
  const displayName = orgName.trim() || 'Organization name';
  const displayShort = shortName.trim() || 'SHORT';

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: primary }]}>
        <View
          style={[styles.blob, styles.blobTop, { backgroundColor: secondary }]}
        />
        <View
          style={[styles.blob, styles.blobBottom, { backgroundColor: tertiary }]}
        />

        <View style={styles.headerRow}>
          <View style={styles.orgMeta}>
            <AppText weight="bold" numberOfLines={2} style={[styles.orgName, { color: onPrimary }]}>
              {displayName}
            </AppText>
            <AppText style={[styles.orgShort, { color: onPrimary }]}>
              {displayShort}
            </AppText>
          </View>
          {logoUri ? (
            <ProgressiveImage source={{ uri: logoUri }} style={styles.logo} resizeMode="cover" />
          ) : null}
        </View>

        <View style={styles.memberRow}>
          <View style={[styles.avatar]}>
            <Icon name="person" size={20} color={onPrimary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText weight="bold" numberOfLines={1} style={[styles.personName, { color: onPrimary }]}>
              {personName}
            </AppText>
            <AppText style={[styles.roleLabel, { color: onPrimary }]}>{roleLabel}</AppText>
          </View>
        </View>

        <View style={styles.footerRow}>
          <AppText style={[styles.idLabel, { color: onPrimary }]}>ID: 882910</AppText>
          <View style={styles.qrWrap}>
            <QRCode value="preview" size={28} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    alignSelf: 'center',
    marginBottom: 24,
  },
  card: {
    width: '100%',
    aspectRatio: 1.58,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTop: {
    top: -24,
    right: -24,
    width: 88,
    height: 88,
    opacity: 0.5,
  },
  blobBottom: {
    bottom: -32,
    left: -16,
    width: 100,
    height: 100,
    opacity: 0.4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    zIndex: 1,
  },
  orgMeta: {
    flex: 1,
    minWidth: 0,
  },
  orgName: {
    fontSize: 15,
    lineHeight: 19,
  },
  orgShort: {
    fontSize: 11,
    opacity: 0.85,
    marginTop: 2,
    letterSpacing: 0.6,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personName: {
    fontSize: 16,
    lineHeight: 20,
  },
  roleLabel: {
    fontSize: 11,
    opacity: 0.8,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  idLabel: {
    fontSize: 10,
    opacity: 0.8,
  },
  qrWrap: {
    padding: 3,
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
});
