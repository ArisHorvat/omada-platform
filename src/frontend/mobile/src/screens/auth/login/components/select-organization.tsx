import React from 'react';
import { View, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '@/src/hooks';
import { AppText, GlassView, Icon, AppButton } from '@/src/components/ui';
import { UserOrganizationDto } from '@/src/types/api';

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
  isLoading 
}: SelectOrganizationProps) {
  const colors = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={20} style={StyleSheet.absoluteFill}>
        <View style={styles.container}>
          <GlassView intensity={40} style={styles.modalContent}>
            
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Icon name="business" size={32} color={colors.primary} />
              </View>
              <AppText variant="h3" style={{ textAlign: 'center' }}>Select Organization</AppText>
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
                  <GlassView 
                    intensity={20} 
                    style={[
                      styles.orgItem, 
                      { borderColor: org.isCurrent ? colors.primary : 'transparent', borderWidth: 1 }
                    ]}
                  >
                    <View style={[styles.orgIcon, { backgroundColor: colors.text }]}>
                      <AppText style={{ color: colors.background, fontWeight: 'bold' }}>
                        {org.organizationName.charAt(0).toUpperCase()}
                      </AppText>
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <AppText weight="bold" numberOfLines={1}>{org.organizationName}</AppText>
                      <AppText variant="caption" style={{ color: colors.subtle }}>
                        {org.role}
                      </AppText>
                    </View>

                    <Icon name="chevron-right" size={24} color={colors.subtle} />
                  </GlassView>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <AppButton 
              title="Cancel" 
              variant="outline" 
              onPress={onCancel} 
              disabled={isLoading}
              style={{ marginTop: 16 }}
            />

          </GlassView>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden'
  },
  header: {
    alignItems: 'center',
    marginBottom: 24
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  list: {
    flexGrow: 0
  },
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12
  },
  orgIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  }
});