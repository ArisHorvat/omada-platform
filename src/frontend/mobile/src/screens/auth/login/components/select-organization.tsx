import React from 'react';
import { View, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { useThemeColors } from '@/src/hooks';
import { AppText, ClayView, Icon, AppButton } from '@/src/components/ui';
import { UserOrganizationDto } from '@/src/api/generatedClient';

interface SelectOrganizationProps {
  visible: boolean;
  organizations: UserOrganizationDto[];
  onSelect: (orgId: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function SelectOrganization({
  visible,
  organizations,
  onSelect,
  onCancel,
  isLoading,
}: SelectOrganizationProps) {
  const colors = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[StyleSheet.absoluteFill, styles.backdrop]}>
        <View style={styles.container}>
          <ClayView depth={10} puffy={14} color={colors.card} style={styles.modalContent}>
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Icon name="business" size={32} color={colors.primary} />
              </View>
              <AppText variant="h3" style={{ textAlign: 'center' }}>
                Select Organization
              </AppText>
              <AppText style={{ color: colors.subtle, textAlign: 'center', marginTop: 8 }}>
                Choose which workspace you want to sign in to.
              </AppText>
            </View>

            <ScrollView style={styles.list} contentContainerStyle={{ gap: 12 }}>
              {organizations.map((org) => (
                <TouchableOpacity
                  key={org.organizationId}
                  onPress={() => !isLoading && onSelect(org.organizationId)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <ClayView
                    depth={5}
                    puffy={10}
                    color={colors.card}
                    style={[
                      styles.orgItem,
                      { borderColor: org.isCurrent ? colors.primary : 'transparent', borderWidth: 1 },
                    ]}
                  >
                    <View style={[styles.orgIcon, { backgroundColor: colors.text }]}>
                      <AppText style={{ color: colors.background, fontWeight: 'bold' }}>
                        {org.organizationName.charAt(0).toUpperCase()}
                      </AppText>
                    </View>

                    <View style={{ flex: 1 }}>
                      <AppText weight="bold" numberOfLines={1}>
                        {org.organizationName}
                      </AppText>
                      <AppText variant="caption" style={{ color: colors.subtle }}>
                        {org.role}
                      </AppText>
                    </View>

                    <Icon name="chevron-right" size={24} color={colors.subtle} />
                  </ClayView>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <AppButton title="Cancel" variant="outline" onPress={onCancel} disabled={isLoading} style={{ marginTop: 16 }} />
          </ClayView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  list: {
    maxHeight: 400,
  },
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  orgIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
