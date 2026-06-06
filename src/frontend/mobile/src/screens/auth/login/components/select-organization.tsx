import React from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { AppButton, AppText, ClayView, Icon, ProgressiveImage } from '@/src/components/ui';
import { AUTH_CONTENT_MAX_WIDTH } from '@/src/constants/layout';
import { useEscapeKey, useThemeColors } from '@/src/hooks';
import { UserOrganizationDto } from '@/src/api/generatedClient';
import { resolveMediaUrl } from '@/src/utils/resolveMediaUrl';

export type OrganizationPickerMode = 'postLogin' | 'switch';

export interface OrganizationPickerModalProps {
  visible: boolean;
  organizations: UserOrganizationDto[];
  onSelect: (org: UserOrganizationDto) => void;
  onCancel: () => void;
  onJoinOrganization?: () => void;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  /** postLogin: every org is tappable (JWT default may show a badge). switch: current org is disabled. */
  mode?: OrganizationPickerMode;
}

export default function OrganizationPickerModal({
  visible,
  organizations,
  onSelect,
  onCancel,
  onJoinOrganization,
  isLoading = false,
  title = 'Select organization',
  subtitle = 'Choose which workspace you want to use.',
  mode = 'switch',
}: OrganizationPickerModalProps) {
  const colors = useThemeColors();
  const isPostLogin = mode === 'postLogin';

  useEscapeKey(visible, onCancel);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} disabled={isLoading} />
        <View style={styles.dialogSlot} pointerEvents="box-none">
          <ClayView depth={14} puffy={18} color={colors.card} style={styles.card}>
            <View style={styles.header}>
              <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}22` }]}>
                <Icon name="business" size={28} color={colors.primary} />
              </View>
              <AppText variant="h3" weight="bold" style={{ textAlign: 'center', color: colors.text }}>
                {title}
              </AppText>
              <AppText
                variant="body"
                style={{ color: colors.subtle, textAlign: 'center', marginTop: 8, lineHeight: 20 }}
              >
                {subtitle}
              </AppText>
            </View>

            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {organizations.map((org) => {
                const logoUri = resolveMediaUrl(org.logoUrl);
                const initial = (org.organizationName?.charAt(0) || 'O').toUpperCase();

                return (
                  <TouchableOpacity
                    key={org.organizationId}
                    onPress={() => !isLoading && onSelect(org)}
                    disabled={isLoading || (!isPostLogin && org.isCurrent)}
                    activeOpacity={0.75}
                  >
                    <ClayView
                      depth={6}
                      puffy={12}
                      color={colors.card}
                      style={[
                        styles.orgRow,
                        org.isCurrent && {
                          borderWidth: 1.5,
                          borderColor: colors.primary,
                          backgroundColor: colors.primaryContainer,
                        },
                      ]}
                    >
                      <View style={[styles.orgLogo, { borderColor: colors.border }]}>
                        {logoUri ? (
                          <ProgressiveImage
                            source={{ uri: logoUri }}
                            style={styles.orgLogoImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.orgLogoFallback, { backgroundColor: colors.primaryContainer }]}>
                            <AppText weight="bold" style={{ color: colors.primary, fontSize: 18 }}>
                              {initial}
                            </AppText>
                          </View>
                        )}
                      </View>

                      <View style={styles.orgMeta}>
                        <AppText variant="body" weight="bold" numberOfLines={1}>
                          {org.organizationName}
                        </AppText>
                        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }} numberOfLines={1}>
                          {org.role === 'Unknown' || !org.role ? 'Member' : org.role}
                        </AppText>
                      </View>

                      {org.isCurrent ? (
                        isPostLogin ? (
                          <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
                            Default
                          </AppText>
                        ) : (
                          <Icon name="check-circle" size={22} color={colors.primary} />
                        )
                      ) : (
                        <Icon name="chevron-right" size={22} color={colors.subtle} />
                      )}
                    </ClayView>
                  </TouchableOpacity>
                );
              })}
              {onJoinOrganization ? (
                <TouchableOpacity
                  onPress={() => !isLoading && onJoinOrganization()}
                  disabled={isLoading}
                  activeOpacity={0.75}
                >
                  <ClayView
                    depth={6}
                    puffy={12}
                    color={colors.card}
                    style={[styles.orgRow, styles.joinRow, { borderColor: colors.border }]}
                  >
                    <View style={[styles.orgLogo, styles.joinIconWrap, { borderColor: colors.primary }]}>
                      <Icon name="add" size={28} color={colors.primary} />
                    </View>
                    <View style={styles.orgMeta}>
                      <AppText variant="body" weight="bold" style={{ color: colors.primary }}>
                        Join organization
                      </AppText>
                      <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                        Enter an invite code to join another workspace
                      </AppText>
                    </View>
                    <Icon name="chevron-right" size={22} color={colors.primary} />
                  </ClayView>
                </TouchableOpacity>
              ) : null}
            </ScrollView>

            <AppButton
              title="Cancel"
              variant="outline"
              onPress={onCancel}
              disabled={isLoading}
              style={{ marginTop: 14 }}
            />
          </ClayView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    ...Platform.select({
      web: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
      },
      default: {},
    }),
  },
  dialogSlot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...Platform.select({
      web: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      default: {},
    }),
  },
  card: {
    width: '100%',
    maxWidth: Math.min(AUTH_CONTENT_MAX_WIDTH + 40, 520),
    maxHeight: '85%',
    padding: 20,
    borderRadius: 28,
    ...Platform.select({
      web: {
        marginHorizontal: 'auto' as const,
      },
      default: {},
    }),
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  list: {
    maxHeight: 360,
  },
  listContent: {
    gap: 10,
    paddingBottom: 4,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  orgLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  orgLogoImage: {
    width: '100%',
    height: '100%',
  },
  orgLogoFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgMeta: {
    flex: 1,
    minWidth: 0,
  },
  joinRow: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  joinIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
